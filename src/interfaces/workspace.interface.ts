export interface WorkspaceResponse {
    businessTagId:   string;
    businessDomain:   string;
    businessTitle:   string;
    logoUrl:   string;
    faviconUrl:   string;
    primaryColor:   string;
    adIntegration?: object;
    twoFALogin?:   boolean;
    onlyOTPLogin?:   boolean;
}