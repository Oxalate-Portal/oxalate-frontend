export interface PortalConfigurationResponse {
    id: number;
    group_key: string;
    setting_key: string;
    value_type: string;
    default_value: string;
    runtime_value: string;
    required_runtime: boolean;
    description: string;
}
