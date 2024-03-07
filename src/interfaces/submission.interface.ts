export interface CreateSubmissionElementDto {
    elementId?: string;
    label: string;
    type?: string;
    value: any;
    required?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    unique?: boolean;
    updateIfUnique?: boolean;
    properties?: Object;
    attributes?: Record<string, unknown>;
    dependencies?: any;
    validations?: any;
    dataType?: string;
    showLabel?: boolean;
    defaultValue?: any;
    isEditRestricted?: boolean;
}

export interface CreateSubmissionDto {
    formId: string;
    elements: CreateSubmissionElementDto[];
    schemaVersion?: string;
    allowDraft?: boolean;
    setDraftInterval?: number;
    createdBy?: number;
    modifiedBy?: number;
    configurations?: any;
    uuid?: string;
}


export interface SubmissionQueryParams {
    skipAutomation?: boolean;
    skipValidations?: boolean;
}