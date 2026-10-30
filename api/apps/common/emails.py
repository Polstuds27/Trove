"""Transactional email delivery.

Render's free tier blocks outbound SMTP (port 25 / unauthenticated relays), so
production delivers mail through the EmailJS REST API instead:

    https://www.emailjs.com/docs/api-reference/rest-api/

The API is plain HTTPS, so it works from any host. When no EmailJS credentials
are configured (local dev, tests) the code falls back to Django's configured
email backend, so callers never need to care which environment they run in.
"""

from __future__ import annotations

import json
import logging
import urllib.request
from email.utils import formataddr, parseaddr

from django.conf import settings
from django.core.mail import send_mail

log = logging.getLogger(__name__)

EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send"


def emailjs_configured() -> bool:
    """True when EmailJS credentials are present in the environment."""
    return bool(
        settings.EMAILJS_SERVICE_ID
        and settings.EMAILJS_TEMPLATE_ID
        and (settings.EMAILJS_PRIVATE_KEY or settings.EMAILJS_PUBLIC_KEY)
    )


def send_template_email(
    *, to: str, subject: str, template_name: str, context: dict | None = None, to_name: str = ""
) -> None:
    """Render a Django template into the generic EmailJS envelope and send it.

    New email types stop here: a template file, no dashboard work, no new env
    vars. Failures are logged, never raised, so mail hiccups don't break API
    requests. Django templates own branding; the provider envelope passes the
    rendered HTML through unchanged.
    """
    from django.template.loader import render_to_string

    template_context = {**(context or {}), "app_url": settings.FRONTEND_URL}
    html_body = render_to_string(f"emails/{template_name}", template_context)
    text_template = template_name.rsplit(".", 1)[0] + ".txt"
    text_body = render_to_string(f"emails/{text_template}", template_context)
    from_name = settings.EMAILJS_FROM_NAME.strip()
    if from_name.lower() in {"", "fintrack"}:
        from_name = "Trove"
    try:
        if emailjs_configured():
            payload = {
                "service_id": settings.EMAILJS_SERVICE_ID,
                "template_id": settings.EMAILJS_TEMPLATE_ID,
                "user_id": settings.EMAILJS_PUBLIC_KEY,
                "accessToken": settings.EMAILJS_PRIVATE_KEY,
                "template_params": {
                    "email": to,
                    "subject": subject,
                    "to_name": to_name,
                    "from_name": from_name,
                    "html_body": html_body,
                },
            }
            _post_emailjs(payload)
        else:
            # Optional SMTP fallback
            sender = formataddr((from_name, parseaddr(settings.DEFAULT_FROM_EMAIL)[1]))
            send_mail(subject, text_body, sender, [to], html_message=html_body)
    except Exception:
        log.exception("Could not send '%s' email to %s", subject, to)


def _post_emailjs(payload: dict) -> None:
    """POST a ready payload to the EmailJS API (shared transport)."""
    request = urllib.request.Request(
        EMAILJS_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Trove/1.0",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            print("EmailJS SUCCESS:", response.read().decode())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print("EMAILJS HTTP ERROR")
        print("Status:", exc.code)
        print("Response:", body)
        raise


def send_email(*, to: str, link: str = "") -> None:
    """Send a password-reset email through the generic envelope template."""
    send_template_email(
        to=to,
        subject="Reset your Trove password",
        template_name="password_reset.html",
        context={"link": link},
    )


def send_verification_email(*, to: str, link: str, name: str) -> None:
    """Send a verification email through the generic envelope template."""
    send_template_email(
        to=to,
        subject="Verify your Trove account",
        template_name="verify.html",
        context={"link": link, "name": name},
        to_name=name,
    )


def send_mfa_code_email(*, to: str, code: str, minutes: int = 15) -> None:
    """Send a one-time MFA backup code for the email recovery flow."""
    send_template_email(
        to=to,
        subject="Your Trove sign-in code",
        template_name="mfa_code.html",
        context={"code": code, "minutes": minutes},
    )
