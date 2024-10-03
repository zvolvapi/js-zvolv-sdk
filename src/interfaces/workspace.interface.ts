export interface Workspace {
    businessTagId: string;
    businessDomain: string;
    businessTitle: string;
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    adIntegration?: object;
    twoFALogin?: boolean;
    onlyOTPLogin?: boolean;
}

export interface InitPayload {
    ADOBE_PDF_EMBED_KEY: string;
    AUTHENTICATION: string;
    BUILD: string;
    CAPTCH_KEY: string;
    DOMAIN: string;
    HOST: string;
    ISNEWPROJECTSSCREEN: boolean;
    LEGACY_GIT_TAG: string;
    PROTOCOL: string;
    SOCKET: boolean;
    VERSION: string;
    ZVOLV_APP_VERSION: string;
    SSO: {
        SSO_CLIENT: string;
        SSO_TITLE: string;
    }
}

export interface WorkspaceV2 {
    URL: string;
    INIT_CONFIG: InitPayload;
    VERSION: string;
    CONFIG: ConfigV2;
    isLoggedIn: boolean;
}
export interface ConfigV2 {
    URL_PREFIX: string;
    BUSINESS_TAG_ID: string;
    BUSINESS_DOMAIN: string;
    LOGO_URL: string;
    BACKGROUND_URL: string;
    ALIGNMENT: string;
    PRIMARY_COLOR: string;
    LOGO_TEXT: LOGOTEXT;
    FAVICON_URL?: null;
    APP_CONFIG: APPCONFIG;
    SHOW_DOSSIER_BTN: boolean;
    SITE_WISE_DOSSIER: boolean;
    SHOW_DASHBOARD_LIST_FILTERS: boolean;
    SHOW_DASHBOARD_TIME_FILTERS: boolean;
    ADFS_INTEGRATION: boolean;
    MIN_DATE_LIMIT: boolean;
    ENABLE_DASHBOARD_V2: boolean;
    ENABLE_DASHBOARD_V3: boolean;
    ENABLE_ZWALL: boolean;
    ZWallBackgroundImg: string;
    ZWallCenterImgLogo: string;
    ZWallCornerImgLogo: string;
    ZWallViewPerm?: null;
    ShowNewUISwitcher: boolean;
    CUSTOM_ENUM_MAPPING?: (CUSTOMENUMMAPPINGEntity)[] | null;
}
export interface LOGOTEXT {
    colored: string;
}
export interface APPCONFIG {
    MOBILE_LOGIN: boolean;
    TWO_FA_LOGIN: boolean;
    OTP_LOGIN: boolean;
    LANGUAGE_SWITCHER: LANGUAGESWITCHER;
    SHOW_ONLY_CAMERA_IN_FILE_UPLOAD: boolean;
    EMAIL_LOGIN: boolean;
    RECORD_AUDIO: boolean;
    SHOW_ONLY_FILE_BROWSE_IN_FILE_UPLOAD: boolean;
    SHOW_QR_ON_MENU: boolean;
    WORKFLOW_SWITCHER?: null;
    SIGN_UP: boolean;
    THEME_COLOR: string;
    EnableWhatsApp: boolean;
}
export interface LANGUAGESWITCHER {
    allowLanguageSwitch: boolean;
    languages?: (LanguagesEntity)[] | null;
}
export interface LanguagesEntity {
    language: string;
    languageCode: string;
}
export interface CUSTOMENUMMAPPINGEntity {
    ID: number;
    TableName: string;
    EnumTableField: string;
    EnumFieldValue: string;
    EnumDisplayValue: string;
    AuthorID: number;
    query?: null;
    logger: Logger;
}
export interface Logger {
}

