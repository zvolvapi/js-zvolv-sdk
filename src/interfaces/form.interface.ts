export interface RbacConf {
    canReadElementRoles: number[];
    canUpdateElementRoles: number[];
}

export interface AbacConf {
    canReadSubmissionAttributes: string[];
    canUpdateSubmissionAttributes: string[];
}

export interface Element {
    elementId: string;
    label?: string;
    type: string;
    defaultValue?: any;
    required?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    unique?: boolean;
    updateIfUnique?: boolean;
    properties?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
    dependencies?: any;
    validations?: any;
    dataType: string;
    rbacConf?: RbacConf | null;
    abacConf?: AbacConf | null;
    showLabel?: boolean;
}

export interface Form {
    title: string;
    description?: string;
    icon?: string;
    color?: string;
    type: string;
    elements: Element[];
    schemaVersion: string;
    tags?: string[];
    allowDraft?: boolean;
    setDraftInterval?: number;
    canReadRoles?: number[];
    canUpdateRoles?: number[];
    configurations?: Record<string, unknown> | string;
    createdBy?: number;
    modifiedBy?: number;
    uuid?: string;
    abacOperator: string;
}
