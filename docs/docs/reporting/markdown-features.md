# Markdown Features
The markdown syntax used in this project is based on the [CommonMark spec](https://spec.commonmark.org/){ target=_blank} with some extensions.

This document briefly describes the most important markdown syntax.
Non-standard markdown syntax is described more detailed.

## Common Markdown
~~~md linenums="1"
# Heading h1
## Heading h2
### Heading h3
#### Heading h4

Inline text styling: **bold**, _italic_, ~~strikethrough~~, `code`

Links: [Example Link](https://example.com)

* list
* items
  * nested list

1. numbered
2. list

```bash
echo "multiline code block";
# with syntax highlighting
```
~~~

## Underline
Underline is not supported in markdown. However you can insert HTML `<u>` tags to underline text.

```md linenums="1"
Text with <u>underlined</u> content.
```

## Images
Images use the standard markdown syntax, but are rendered as figures with captions.

```md linenums="1"
![Figure Caption](img.png){width="50%"}

![caption _with_ **markdown** `code`](img.png)
```

``` html linenums="1"
<figure>
  <img src="https://example.com/img.png" style="width: 50%">
  <figcaption>Figure Caption</figcaption>
</figure>
```

## Footnotes
```md linenums="1"
Text text^[footnote content] text.
```

## Tables
For tables the GFM-like table syntax is used.
This syntax is extended to support table captions.

```md linenums="1"
| table | header |
| ------- | --------- |
| cell    | value   |

: table caption
```

## Code blocks
Code blocks allow including source code and highlight it.


The following example shows how to apply syntax highlighting to a HTTP request.
Many other programming languages are also supported.
````md linenums="1"
```http
POST /login.php HTTP/1.1
Host: sqli.example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 33

username='or'1'='1&password=dummy
```
````

Syntax highlighting is great for readability, but it only highlights predefined keywords of the specified language.
However, it does not allow to manually highlight certain text parts to draw the readers attention to it.

You can enable manual highlighting by adding code-block meta attribute `highlight-manual`. 
It is now possible to encapsulate highlighted areas with `§§highlighted content§§`.
In the rendered HTML code, the content inside the two `§§`-placeholders is wrapped by a HTML `<mark>` tag.
This works in combination with language-based syntax highlighting.

This example highlights the vulnerable POST-parameter `username` in the HTTP body.
````md linenums="1"
```http highlight-manual
POST /login.php HTTP/1.1
Host: sqli.example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 33

§§username='or'1'='1§§&password=dummy
```
````

If you need more advanced highlighting, you can place cutom HTML code inside the `§§` placeholders e.g. `§<mark><em><span class="custom-highlight">§`.
If your code snippet includes `§`-characters, you cannot use them as escape characters for manual highlighting. 
It is possible to specify a different escaple character via the `highlight-manual="<escape-character>"` attribute.
Make sure that the escape character is not present in the code block.

The following example uses `"|"` as escape character and a custom HTML markup for highlighting.
````md linenums="1"
```http highlight-manual="|"
POST /login.php HTTP/1.1
Host: sqli.example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 33

|<mark><em><span class="custom-highlight">|username='or'1'='1|</span></em></mark>|&password=dummy
```
````


## HTML Attributes
This extension allows you to set HTML attributes from markdown.
Place attributes in curly braces directly after the targeted element (without spaces between). 
Attributes are key value pairs (`attr-name="attr-value"`)
Shortcuts for setting the attribute `id` (`#id-value`) and `class` (`.class-value`) are supported.

```md linenums="1"
![image](img.png){#img-id .image-class1 .image-class2 width="50%"}

Text with [styled link](https://example.com/){class="link-class" style="color: red"} in it.
```

## Inline HTML
If something is not possible with markdown, you can fall back to writing HTML code and embed it in the markdown document.

```md linenums="1"
Text *with* **markdown** `code`.

<figure class="figure-side-by-side">
  <img src="img1.png" />
  <img src="img2.png" />
  <figcaption>Two images side-by-side</figcaption>
</figure>
```
