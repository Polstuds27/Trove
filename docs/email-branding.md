# Trove transactional emails

The API renders the complete Trove layout for email verification, password
reset, and one-time sign-in codes. Templates live in
`api/apps/common/templates/emails/`; `base.html` provides the shared forest,
cream, and sage design. HTML uses inline styles, presentation tables, and
system fonts. Buttons have copyable link fallbacks. Django delivery includes
plain-text and HTML alternatives.

Deploy the API changes to update outgoing mail. No migration is needed.

## EmailJS dashboard setup

The hosted EmailJS template is separate from the repository. If it still has
the previous FinTrack header, colors, or footer, replace its entire HTML body
with the contents of `docs/emailjs-envelope.html`:

```html
{{{html_body}}}
```

Set these fields in the same EmailJS template:

| Field | Value |
| --- | --- |
| To Email | `{{email}}` |
| To Name | `{{to_name}}` |
| Subject | `{{subject}}` |
| From Name | `{{from_name}}` (or `Trove`) |

Keep the configured sender email/service as it is. Set `EMAILJS_FROM_NAME=Trove`
in the deployment environment; the API also translates the legacy `FinTrack`
display-name setting to `Trove`. Existing service IDs, template IDs, API keys,
verification links, and authentication behavior are unchanged.

Preview HTML under `docs/email-previews/` uses fictional names, example links,
and a dummy code. It does not send email or contain working account tokens.
