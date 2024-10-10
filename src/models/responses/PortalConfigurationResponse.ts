export interface PortalConfigurationResponse {
    id: number;
    groupKey: string;
    settingKey: string;
    valueType: string;
    defaultValue: string;
    runtimeValue: string;
    requiredRuntime: boolean;
    description: string;
}