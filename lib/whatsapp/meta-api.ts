/**
 * Meta WhatsApp Business Cloud API helper
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const META_API_VERSION = 'v21.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface WaBusinessConfig {
  waba_id: string;
  phone_number_id: string;
  access_token: string;
  business_id?: string;
  app_id?: string;
}

// ==========================================
// Template Types
// ==========================================

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type HeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
export type ButtonType = 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string;          // For URL buttons (supports {{1}} variable)
  phone_number?: string; // For PHONE_NUMBER buttons
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
    header_handle?: string[];
  };
  buttons?: MetaButton[];
}

interface MetaButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface MetaTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: TemplateComponent[];
}

// ==========================================
// Template Management
// ==========================================

/**
 * Sync templates from Meta for a given WABA
 */
export async function syncTemplates(config: WaBusinessConfig): Promise<MetaTemplate[]> {
  const url = `${META_GRAPH_URL}/${config.waba_id}/message_templates?limit=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Meta API error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Create a new template on Meta
 */
export async function createTemplate(
  config: WaBusinessConfig,
  template: {
    name: string;
    language: string;
    category: TemplateCategory;
    components: TemplateComponent[];
  }
): Promise<{ id: string; status: string }> {
  const url = `${META_GRAPH_URL}/${config.waba_id}/message_templates`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: template.name,
      language: template.language,
      category: template.category,
      components: template.components,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Meta API error: ${err.error?.message || res.statusText}`);
  }

  return await res.json();
}

/**
 * Delete a template from Meta
 */
export async function deleteTemplate(
  config: WaBusinessConfig,
  templateName: string
): Promise<void> {
  const url = `${META_GRAPH_URL}/${config.waba_id}/message_templates?name=${templateName}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${config.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Meta API error: ${err.error?.message || res.statusText}`);
  }
}

// ==========================================
// Upload media for template headers
// ==========================================

/**
 * Upload media to get a handle for template header
 */
export async function uploadMedia(
  config: WaBusinessConfig,
  file: Uint8Array,
  mimeType: string,
  fileName: string
): Promise<string> {
  // Step 1: Create upload session
  const sessionUrl = `${META_GRAPH_URL}/${config.app_id || config.phone_number_id}/uploads`;
  const sessionRes = await fetch(sessionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_length: file.byteLength,
      file_type: mimeType,
      file_name: fileName,
    }),
  });

  if (!sessionRes.ok) {
    const err = await sessionRes.json();
    throw new Error(`Upload session error: ${err.error?.message || sessionRes.statusText}`);
  }

  const { id: uploadSessionId } = await sessionRes.json();

  // Step 2: Upload file data
  const uploadUrl = `${META_GRAPH_URL}/${uploadSessionId}`;
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${config.access_token}`,
      file_offset: '0',
      'Content-Type': mimeType,
    },
    body: file as unknown as BodyInit,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`Upload error: ${err.error?.message || uploadRes.statusText}`);
  }

  const { h: handle } = await uploadRes.json();
  return handle;
}

// ==========================================
// Send Template Messages
// ==========================================

export interface SendTemplateParams {
  phoneNumber: string;       // E.164 format with country code
  templateName: string;
  language: string;
  headerParams?: string[];   // Header variable values
  bodyParams?: string[];     // Body variable values {{1}}, {{2}} etc.
  buttonParams?: { index: number; subType: string; parameters: any[] }[];
  headerMediaUrl?: string;   // For image/video/doc headers
  headerMediaType?: 'image' | 'video' | 'document';
}

/**
 * Send a template message to a single recipient
 */
export async function sendTemplateMessage(
  config: WaBusinessConfig,
  params: SendTemplateParams
): Promise<{ messages: { id: string }[] }> {
  const url = `${META_GRAPH_URL}/${config.phone_number_id}/messages`;

  // Build template components
  const components: any[] = [];

  // Header component (text or media)
  if (params.headerMediaUrl && params.headerMediaType) {
    components.push({
      type: 'header',
      parameters: [{
        type: params.headerMediaType,
        [params.headerMediaType]: { link: params.headerMediaUrl },
      }],
    });
  } else if (params.headerParams && params.headerParams.length > 0) {
    components.push({
      type: 'header',
      parameters: params.headerParams.map(val => ({ type: 'text', text: val })),
    });
  }

  // Body component
  if (params.bodyParams && params.bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: params.bodyParams.map(val => ({ type: 'text', text: val })),
    });
  }

  // Button components
  if (params.buttonParams) {
    params.buttonParams.forEach(bp => {
      components.push({
        type: 'button',
        sub_type: bp.subType,
        index: bp.index,
        parameters: bp.parameters,
      });
    });
  }

  const payload: any = {
    messaging_product: 'whatsapp',
    to: params.phoneNumber.replace(/^\+/, ''),
    type: 'template',
    template: {
      name: params.templateName,
      language: { code: params.language },
    },
  };

  if (components.length > 0) {
    payload.template.components = components;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Send error: ${err.error?.message || res.statusText}`);
  }

  return await res.json();
}

// ==========================================
// Build template components for Meta API
// ==========================================

export function buildTemplateComponents(opts: {
  headerType: HeaderType;
  headerContent?: string;
  bodyText: string;
  footerText?: string;
  buttons: TemplateButton[];
}): TemplateComponent[] {
  const components: TemplateComponent[] = [];

  // Header
  if (opts.headerType !== 'NONE' && opts.headerContent) {
    if (opts.headerType === 'TEXT') {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: opts.headerContent,
      });
    } else {
      // IMAGE, VIDEO, DOCUMENT - headerContent is the media handle
      components.push({
        type: 'HEADER',
        format: opts.headerType as 'IMAGE' | 'VIDEO' | 'DOCUMENT',
        example: { header_handle: [opts.headerContent] },
      });
    }
  }

  // Body (required)
  const bodyVars = opts.bodyText.match(/\{\{\d+\}\}/g);
  const bodyComponent: TemplateComponent = {
    type: 'BODY',
    text: opts.bodyText,
  };
  if (bodyVars && bodyVars.length > 0) {
    bodyComponent.example = {
      body_text: [bodyVars.map((_, i) => `example_${i + 1}`)],
    };
  }
  components.push(bodyComponent);

  // Footer
  if (opts.footerText) {
    components.push({
      type: 'FOOTER',
      text: opts.footerText,
    });
  }

  // Buttons
  if (opts.buttons.length > 0) {
    const metaButtons: MetaButton[] = opts.buttons.map(btn => {
      const metaBtn: MetaButton = {
        type: btn.type,
        text: btn.text,
      };
      if (btn.type === 'URL' && btn.url) {
        metaBtn.url = btn.url;
        if (btn.url.includes('{{1}}')) {
          metaBtn.example = ['https://example.com'];
        }
      }
      if (btn.type === 'PHONE_NUMBER' && btn.phone_number) {
        metaBtn.phone_number = btn.phone_number;
      }
      return metaBtn;
    });

    components.push({
      type: 'BUTTONS',
      buttons: metaButtons,
    });
  }

  return components;
}
