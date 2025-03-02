<template>
  <split-menu v-model="menuSize">
    <template #menu>
      <pdf-preview
        ref="pdfPreviewRef"
        :fetch-pdf="fetchPreviewPdf"
        :show-loading-spinner-on-reload="true"
      />
    </template>

    <template #default>
      <h1>{{ project.name }}</h1>

      <v-form class="pa-4">
        <!-- Action buttons -->
        <div>
          <s-btn-secondary
            :loading="checksOrPreviewInProgress"
            :disabled="checksOrPreviewInProgress"
            @click="refreshPreviewAndChecks"
            prepend-icon="mdi-cached"
            text="Refresh PDF"
            class="mr-1 mb-1"
          >
            <template #loader>
              <s-saving-loader-spinner />
              Refresh PDF
            </template>
          </s-btn-secondary>

          <btn-confirm
            :action="customizeDesign"
            button-text="Customize Design"
            button-icon="mdi-file-cog"
            tooltip-text="Customize Design for this project"
            dialog-text="Customize the current Design for this project. This allows you to adapt the appearence (HTML, CSS) of the design for this project only. The original design is not affected. Any changes made to the original design will not be automatically applied to the adapted design."
            :disabled="project.readonly || projectType.source === 'customized' || !auth.permissions.value.update_project_settings"
            class="mb-1"
          />
        </div>

        <!-- Set password for encrypting report -->
        <div>
          <s-checkbox v-model="localSettings.encryptPdfEnabled" label="Encrypt report PDF" />
          <s-text-field
            v-if="localSettings.encryptPdfEnabled"
            v-model="form.password"
            :error-messages="(localSettings.encryptPdfEnabled && form.password.length === 0) ? ['Password required'] : []"
            label="PDF password"
            append-inner-icon="mdi-lock-reset" @click:append-inner="form.password = generateRandomPassword()"
            spellcheck="false"
            class="mt-4"
          />
        </div>

        <!-- Filename -->
        <div>
          <s-text-field
            v-model="form.filename"
            label="Filename"
            :rules="rules.filename"
            spellcheck="false"
            class="mt-4"
          />
        </div>

        <div class="mt-4">
          <btn-confirm
            :disabled="!canGenerateFinalReport"
            :action="generateFinalReport.run"
            :confirm="false"
            button-text="Download"
            button-icon="mdi-download"
            button-color="primary"
          />
        </div>
        <div class="mt-4">
          <btn-readonly
            v-if="!project.readonly"
            :value="project.readonly"
            :set-readonly="setReadonly"
            :disabled="!canGenerateFinalReport || !auth.permissions.value.update_project_settings"
          />
        </div>
      </v-form>

      <error-list v-if="checkMessagesStatus !== 'pending'" :value="allMessages" :group="true" :show-no-message-info="true">
        <template #location="{msg}">
          <NuxtLink v-if="messageLocationUrl(msg) && msg.location" :to="messageLocationUrl(msg)" @click="onBeforeOpenMessageLocationUrl(msg)" target="_blank" class="text-primary">
            in {{ msg.location.type }}
            <span v-if="msg.location.name"> "{{ msg.location.name }}"</span>
            <span v-if="msg.location.path"> field "{{ msg.location.path }}"</span>
          </NuxtLink>
          <span v-else-if="msg.location?.name">
            in {{ msg.location.type }}
            <span v-if="msg.location.name"> "{{ msg.location.name }}"</span>
            <span v-if="msg.location.path"> field "{{ msg.location.path }}"</span>
          </span>
        </template>
      </error-list>
      <div v-else class="text-center pa-6">
        <v-progress-circular indeterminate />
      </div>
    </template>
  </split-menu>
</template>

<script setup lang="ts">
import { fileDownload, generateRandomPassword } from "@base/utils/helpers";

definePageMeta({
  title: 'Publish',
});

const route = useRoute();
const auth = useAuth();
const localSettings = useLocalSettings();
const projectStore = useProjectStore();
const projectTypeStore = useProjectTypeStore();

const project = await useAsyncDataE(async () => await projectStore.getById(route.params.projectId as string), { key: 'publish:project' });
const projectType = await useAsyncDataE(async () => await projectTypeStore.getById(project.value.project_type), { key: 'publish:projecttype' });

const { data: checkMessages, status: checkMessagesStatus, refresh: refreshCheckMessages } = useLazyFetch<{ messages: ErrorMessage[] }>(`/api/v1/pentestprojects/${project.value.id}/check/`, { method: 'GET' });
const pdfPreviewRef = ref();
const allMessages = computed(() => {
  const out = [] as ErrorMessage[];
  if (checkMessages.value?.messages) {
    out.push(...checkMessages.value.messages);
  }
  if (pdfPreviewRef.value?.messages) {
    out.push(...pdfPreviewRef.value.messages);
  }
  if (checkMessagesStatus.value === 'error') {
    out.push({
      level: MessageLevel.ERROR,
      message: 'Error while checking project',
    });
  }
  return out;
});
const hasErrors = computed(() => allMessages.value.some(m => m.level === MessageLevel.ERROR));

const form = ref({
  password: generateRandomPassword(),
  filename: (project.value.name + '_report.pdf').replaceAll(/[\\/]/g, '').replaceAll(/\s+/g, ' '),
});
const rules = {
  filename: [(v: string) => (Boolean(v) && /^[^/\\]+$/.test(v)) || 'Invalid filename'],
}

const menuSize = ref(50);
const checksOrPreviewInProgress = computed(() => checkMessagesStatus.value === 'pending' || pdfPreviewRef.value?.renderingInProgress);
const canGenerateFinalReport = computed(() => {
  return !hasErrors.value &&
        !checksOrPreviewInProgress.value &&
        pdfPreviewRef.value?.pdfData !== null &&
        (localSettings.encryptPdfEnabled ? form.value.password.length > 0 : true);
});

function refreshPreviewAndChecks() {
  if (checksOrPreviewInProgress.value) {
    return;
  }

  pdfPreviewRef.value.reloadImmediate();
  refreshCheckMessages();
}
async function fetchPreviewPdf(fetchOptions: { signal: AbortSignal }) {
  return await $fetch<PdfResponse>(`/api/v1/pentestprojects/${project.value.id}/preview/`, {
    method: 'POST',
    body: {},
    ...fetchOptions,
  });
}

const generateFinalReport = useAbortController(async (fetchOptions: { signal: AbortSignal }) => {
  const res = await $fetch<Blob>(`/api/v1/pentestprojects/${project.value.id}/generate/`, {
    method: 'POST',
    body: {
      password: localSettings.encryptPdfEnabled ? form.value.password : null,
    },
    responseType: "blob",
    ...fetchOptions,
  });
  fileDownload(res, form.value.filename + (form.value.filename.endsWith('.pdf') ? '' : '.pdf'));
});
async function setReadonly() {
  await projectStore.setReadonly(project.value, true);
}
async function customizeDesign() {
  await projectStore.customizeDesign(project.value);
  await navigateTo(`/projects/${project.value.id}/designer/`);
}

function messageLocationUrl(msg: ErrorMessage) {
  if (!msg || !msg.location) {
    return undefined;
  } else if (msg.location.type === 'section') {
    return `/projects/${project.value.id}/reporting/sections/${msg.location.id}/` + (msg.location.path ? '#' + msg.location.path : '');
  } else if (msg.location.type === 'finding') {
    return `/projects/${project.value.id}/reporting/findings/${msg.location.id}/` + (msg.location.path ? '#' + msg.location.path : '');
  } else if (msg.location.type === 'design') {
    return `/designs/${project.value.project_type}/pdfdesigner/`;
  }

  return undefined;
}

function onBeforeOpenMessageLocationUrl(msg: ErrorMessage) {
  if (msg.message.includes('comment')) {
    // Open comment sidebar
    localSettings.reportingCommentSidebarVisible = true;
    localSettings.reportingCommentStatusFilter = CommentStatus.OPEN;
    localSettings.$persist();
  }
}

</script>
