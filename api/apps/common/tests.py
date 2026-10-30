import json
from unittest.mock import patch

import pytest
from django.core import mail
from django.test import Client, override_settings

pytestmark = pytest.mark.django_db

EMAILJS = {
    "EMAILJS_SERVICE_ID": "svc",
    "EMAILJS_TEMPLATE_ID": "tpl",
    "EMAILJS_PUBLIC_KEY": "pub",
    "EMAILJS_PRIVATE_KEY": "priv",
    "EMAILJS_FROM_NAME": "Trove",
}


def register(client):
    return client.post(
        "/api/v1/auth/register/",
        {"email": "a@b.com", "password": "Str0ng!Pass", "password_confirm": "Str0ng!Pass"},
    )


def test_register_falls_back_to_django_backend():
    mail.outbox.clear()
    assert register(Client()).status_code == 201
    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.subject == "Verify your Trove account"
    assert message.from_email.startswith("Trove <")
    assert "<html" not in message.body
    assert "&amp;" not in message.body
    assert message.alternatives[0][1] == "text/html"
    assert "Trove" in message.alternatives[0][0]


def test_register_sends_through_emailjs_when_configured():
    mail.outbox.clear()
    with (
        override_settings(**EMAILJS),
        patch("apps.common.emails.urllib.request.urlopen") as urlopen,
    ):
        assert register(Client()).status_code == 201

    request = urlopen.call_args.args[0]
    payload = json.loads(request.data)
    assert payload["service_id"] == "svc"
    assert payload["template_id"] == "tpl"
    assert payload["accessToken"] == "priv"  # private key preferred over public
    params = payload["template_params"]
    assert params["email"] == "a@b.com"
    assert params["subject"] == "Verify your Trove account"
    assert params["from_name"] == "Trove"
    assert "FinTrack" not in params["html_body"]
    assert "verify-email" in params["html_body"]
    assert not mail.outbox  # Django backend not used when EmailJS is on


def test_password_reset_uses_the_same_generic_template():
    from apps.common.emails import send_email

    with (
        override_settings(**EMAILJS),
        patch("apps.common.emails.urllib.request.urlopen") as urlopen,
    ):
        send_email(to="a@b.com", link="https://app/reset/abc")

    payload = json.loads(urlopen.call_args.args[0].data)
    assert payload["template_id"] == "tpl"
    assert payload["template_params"]["subject"] == "Reset your Trove password"
    assert "https://app/reset/abc" in payload["template_params"]["html_body"]


def test_mfa_code_sender_renders_code_and_expiry():
    from apps.common.emails import send_mfa_code_email

    with (
        override_settings(**EMAILJS),
        patch("apps.common.emails.urllib.request.urlopen") as urlopen,
    ):
        send_mfa_code_email(to="a@b.com", code="12345678")

    payload = json.loads(urlopen.call_args.args[0].data)
    assert payload["template_id"] == "tpl"
    assert payload["template_params"]["subject"] == "Your Trove sign-in code"
    assert "12345678" in payload["template_params"]["html_body"]
    assert "15 minutes" in payload["template_params"]["html_body"]


def test_mail_failure_never_breaks_the_request():
    from apps.common.emails import send_mfa_code_email

    with (
        override_settings(**EMAILJS),
        patch("apps.common.emails.urllib.request.urlopen", side_effect=TimeoutError),
    ):
        send_mfa_code_email(to="a@b.com", code="12345678")  # must not raise
