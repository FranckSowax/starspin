/**
 * WhatsApp dual client — routes messages to Meta Cloud API or Whapi based on config.provider
 */

import type {
  WhatsAppConfig,
  WhatsAppInteractivePayload,
  WhatsAppTextPayload,
  WhatsAppTemplatePayload,
  WhatsAppCarouselPayload,
  WhatsAppSendResult,
} from './types';

const META_API_VERSION = 'v21.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;
const WHAPI_URL = 'https://gate.whapi.cloud';

// ==========================================
// Public API — auto-routes by provider
// ==========================================

export async function sendInteractiveMessage(
  config: WhatsAppConfig,
  payload: WhatsAppInteractivePayload
): Promise<WhatsAppSendResult> {
  if (config.provider === 'meta') return metaSendInteractive(config, payload);
  return whapiSendInteractive(config, payload);
}

export async function sendTextMessage(
  config: WhatsAppConfig,
  payload: WhatsAppTextPayload
): Promise<WhatsAppSendResult> {
  if (config.provider === 'meta') return metaSendText(config, payload);
  return whapiSendText(config, payload);
}

export async function sendTemplateMessage(
  config: WhatsAppConfig,
  payload: WhatsAppTemplatePayload
): Promise<WhatsAppSendResult> {
  if (config.provider !== 'meta') {
    return { success: false, error: 'Template messages require Meta Cloud API' };
  }
  return metaSendTemplate(config, payload);
}

export async function sendCarouselMessage(
  config: WhatsAppConfig,
  payload: WhatsAppCarouselPayload
): Promise<WhatsAppSendResult> {
  if (config.provider !== 'whapi') {
    return { success: false, error: 'Carousel messages require Whapi' };
  }
  return whapiSendCarousel(config, payload);
}

// ==========================================
// Meta Cloud API implementations
// ==========================================

async function metaSendTemplate(
  config: WhatsAppConfig,
  payload: WhatsAppTemplatePayload
): Promise<WhatsAppSendResult> {
  const url = `${META_GRAPH_URL}/${config.phoneNumberId}/messages`;

  const body: any = {
    messaging_product: 'whatsapp',
    to: payload.to.replace(/^\+/, ''),
    type: 'template',
    template: {
      name: payload.templateName,
      language: { code: payload.languageCode },
    },
  };

  if (payload.components && payload.components.length > 0) {
    body.template.components = payload.components;
  }

  return metaFetch(url, config.accessToken!, body);
}

async function metaSendInteractive(
  config: WhatsAppConfig,
  payload: WhatsAppInteractivePayload
): Promise<WhatsAppSendResult> {
  const url = `${META_GRAPH_URL}/${config.phoneNumberId}/messages`;

  const interactive: any = {
    type: 'button',
    body: { text: payload.body },
    action: {
      buttons: payload.buttons.slice(0, 3).map((btn, i) => ({
        type: 'reply',
        reply: { id: btn.id || `btn_${i}`, title: btn.title.substring(0, 20) },
      })),
    },
  };

  if (payload.header) {
    if (payload.header.type === 'text') {
      interactive.header = { type: 'text', text: payload.header.text };
    } else if (payload.header.link) {
      interactive.header = { type: payload.header.type, [payload.header.type]: { link: payload.header.link } };
    }
  }

  if (payload.footer) {
    interactive.footer = { text: payload.footer };
  }

  const body = {
    messaging_product: 'whatsapp',
    to: payload.to.replace(/^\+/, ''),
    type: 'interactive',
    interactive,
  };

  return metaFetch(url, config.accessToken!, body);
}

async function metaSendText(
  config: WhatsAppConfig,
  payload: WhatsAppTextPayload
): Promise<WhatsAppSendResult> {
  const url = `${META_GRAPH_URL}/${config.phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: payload.to.replace(/^\+/, ''),
    type: 'text',
    text: { body: payload.body },
  };

  return metaFetch(url, config.accessToken!, body);
}

async function metaFetch(url: string, token: string, body: any): Promise<WhatsAppSendResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error?.message || `Meta API ${res.status}` };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// Meta Template Management
// ==========================================

export async function syncTemplatesFromMeta(
  config: WhatsAppConfig
): Promise<any[]> {
  const url = `${META_GRAPH_URL}/${config.wabaId}/message_templates?limit=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Meta API ${res.status}`);
  }
  const data = await res.json();
  return data.data || [];
}

export async function createTemplateOnMeta(
  config: WhatsAppConfig,
  template: { name: string; language: string; category: string; components: any[] }
): Promise<{ id: string; status: string }> {
  const url = `${META_GRAPH_URL}/${config.wabaId}/message_templates`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Meta API ${res.status}`);
  }
  return await res.json();
}

export async function deleteTemplateOnMeta(
  config: WhatsAppConfig,
  templateName: string
): Promise<void> {
  const url = `${META_GRAPH_URL}/${config.wabaId}/message_templates?name=${templateName}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Meta API ${res.status}`);
  }
}

export async function verifyMetaToken(
  phoneNumberId: string,
  accessToken: string
): Promise<{ verified: boolean; display_phone?: string; error?: string }> {
  try {
    const url = `${META_GRAPH_URL}/${phoneNumberId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) return { verified: false, error: data.error?.message };
    return { verified: true, display_phone: data.display_phone_number };
  } catch (err: any) {
    return { verified: false, error: err.message };
  }
}

// ==========================================
// Whapi implementations (legacy)
// ==========================================

async function whapiSendInteractive(
  config: WhatsAppConfig,
  payload: WhatsAppInteractivePayload
): Promise<WhatsAppSendResult> {
  return whapiFetch(`${WHAPI_URL}/messages/interactive`, config.whapiApiKey!, {
    to: payload.to.replace(/^\+/, ''),
    type: 'button',
    header: payload.header,
    body: { text: payload.body },
    footer: payload.footer ? { text: payload.footer } : undefined,
    action: {
      buttons: payload.buttons.map((btn, i) => ({
        type: 'reply',
        reply: { id: btn.id || `btn_${i}`, title: btn.title },
      })),
    },
  });
}

async function whapiSendText(
  config: WhatsAppConfig,
  payload: WhatsAppTextPayload
): Promise<WhatsAppSendResult> {
  return whapiFetch(`${WHAPI_URL}/messages/text`, config.whapiApiKey!, {
    to: payload.to.replace(/^\+/, ''),
    body: payload.body,
  });
}

async function whapiSendCarousel(
  config: WhatsAppConfig,
  payload: WhatsAppCarouselPayload
): Promise<WhatsAppSendResult> {
  return whapiFetch(`${WHAPI_URL}/messages/carousel`, config.whapiApiKey!, {
    to: payload.to.replace(/^\+/, ''),
    body: payload.body,
    cards: payload.cards,
  });
}

async function whapiFetch(url: string, apiKey: string, body: any): Promise<WhatsAppSendResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || `Whapi ${res.status}` };
    }

    return { success: true, messageId: data.message?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
