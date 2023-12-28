import LanguageUtil from "../../helpers/LanguageUtil";
import {Form, Input, Select, Switch} from "antd";
import {useTranslation} from "react-i18next";

export function UserFields(props: { userId: number; username: string; isOrganizer: boolean; }) {
    const {t} = useTranslation();

    return (
            <>
                {props.userId > 0 && <Form.Item label={t('UserFields.form.userId.label')}>
                    <span className="ant-form-text">{props.userId}</span>
                </Form.Item>}
                {props.username !== null && <Form.Item label={t('UserFields.form.username.label')}>
                    <span className="ant-form-text">{props.username}</span>
                </Form.Item>}
                {props.username === null &&
                        <Form.Item name={'username'}
                                   label={t('UserFields.form.username.label')}
                                   tooltip={t('UserFields.form.username.tooltip')}
                                   rules={[
                                       {
                                           required: true,
                                           message: t('UserFields.form.username.rules.required')
                                       },
                                       {
                                           type: 'email',
                                           message: t('UserFields.form.username.rules.email')
                                       }
                                   ]}>
                            <Input type="text" placeholder={t('UserFields.form.username.placeholder')}/>
                        </Form.Item>}
                <Form.Item name={'firstName'}
                           required={true}
                           label={t('UserFields.form.firstName.label')}
                           tooltip={t('UserFields.form.firstName.tooltip')}
                           rules={[
                               {
                                   required: true,
                                   message: t('UserFields.form.firstName.rules.required')
                               },
                               {
                                   min: 2,
                                   message: t('UserFields.form.firstName.rules.min')
                               },
                               {
                                   pattern: new RegExp(/[\p{Letter}\p{Mark} -]+$/gu),
                                   message: t('UserFields.form.firstName.rules.pattern')
                               }
                           ]}>
                    <Input placeholder={t('UserFields.form.firstName.placeholder')}/>
                </Form.Item>
                <Form.Item name={'lastName'}
                           required={true}
                           tooltip={t('UserFields.form.lastName.tooltip')}
                           label={t('UserFields.form.lastName.label')}
                           rules={[
                               {
                                   required: true,
                                   message: t('UserFields.form.lastName.rules.required')
                               },
                               {
                                   min: 1,
                                   message: t('UserFields.form.lastName.rules.min')
                               },
                               {
                                   pattern: new RegExp(/[\p{Letter}\p{Mark} -]+$/gu),
                                   message: t('UserFields.form.lastName.rules.pattern')
                               }
                           ]}>
                    <Input placeholder={t('UserFields.form.lastName.placeholder')}/>
                </Form.Item>
                <Form.Item name="phoneNumber"
                           label={t('UserFields.form.phoneNumber.placeholder')}
                           tooltip={t('UserFields.form.phoneNumber.tooltip')}
                           rules={[
                               {
                                   required: true,
                                   message: t('UserFields.form.phoneNumber.rules.required')
                               },
                               {
                                   min: 10,
                                   message: t('UserFields.form.phoneNumber.rules.min')
                               },
                               {
                                   pattern: new RegExp(/^[0-9]+$/),
                                   message: t('UserFields.form.phoneNumber.rules.pattern')
                               }
                           ]}
                >
                    <Input type={'text'}
                           addonBefore={'+'}
                           style={{width: 300}}></Input>
                </Form.Item>
                <Form.Item name={'privacy'}
                           required={true}
                           label={t('UserFields.form.privacy.label')}
                           tooltip={t('UserFields.form.privacy.tooltip')}
                           valuePropName={'checked'}>
                    <Switch disabled={props.isOrganizer}/>
                </Form.Item>
                <Form.Item name={'nextOfKin'}
                           label={t('UserFields.form.nextOfKin.label')}
                           tooltip={t('UserFields.form.nextOfKin.tooltip')}>
                    <Input type="text"
                           placeholder={t('UserFields.form.nextOfKin.placeholder')}/>
                </Form.Item>
                <Form.Item name={'language'}
                           required={true}
                           label={t('UserFields.form.language.label')}
                           tooltip={t('UserFields.form.language.tooltip')}
                           rules={[
                               {
                                   required: true,
                                   message: t('UserFields.form.language.rules.required')
                               }
                           ]}>
                    <Select options={LanguageUtil.getLanguages()}/>
                </Form.Item>
            </>
    );
}

export default UserFields;
