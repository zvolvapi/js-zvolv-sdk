export interface Workspace {
    businessTagId:   string;
    businessDomain:   string;
    businessTitle: { colored:  string;};
    logoUrl:   string;
    faviconUrl:   string;
    primaryColor:   string;
    adIntegration?: object;
    twoFALogin?:   boolean;
    onlyOTPLogin?:   boolean;
}