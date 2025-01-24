import React, {useEffect, useState} from 'react';
import {Button, Form, message, Select, Spin} from 'antd';
import {MembershipStatusEnum, MembershipTypeEnum} from '../../models/';
import {MembershipResponse} from '../../models/responses/';
import {membershipAPI} from '../../services/';
import {useParams} from 'react-router-dom';
import {MembershipRequest} from "../../models/requests";

export function AdminMembership() {
    const {paramId} = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [membership, setMembership] = useState<MembershipResponse | null>(null);

    useEffect(() => {
        setLoading(true);

        let tmpMembershipId = 0;

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpMembershipId = parseInt(paramId);
        } else {
            console.error('Invalid user id:', paramId);
            message.error('Invalid user id');
            return;
        }

        membershipAPI.findByMemberId(tmpMembershipId)
                .then((response) => {
                    setMembership(response);
                })
                .catch((error) => {
                    console.error('Error fetching membership:', error);
                    message.error('Failed to fetch membership data');
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    const onFinish = (values: any) => {
        if (!membership) {
            return;
        }

        const updatedMembership: MembershipRequest = {
            id: membership.id,
            userId: membership.userId,
            status: values.status,
            type: values.type
        };

        membershipAPI.update(updatedMembership)
                .then(() => {
                    message.success('Membership updated successfully');
                })
                .catch((error) => {
                    console.error('Error updating membership:', error);
                    message.error('Failed to update membership');
                });
    };

    if (loading || !membership) {
        return <Spin/>;
    }

    return (
            <div className="darkDiv">
                <Form form={form}
                      onFinish={onFinish}
                      layout="vertical"
                      initialValues={membership}
                >
                    <Form.Item name="type"
                               label="Membership Type"
                               rules={[{required: true, message: 'Please select a membership type'}]}
                    >
                        <Select>
                            {Object.values(MembershipTypeEnum).map((type) => (
                                    <Select.Option key={type} value={type}>
                                        {type}
                                    </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="status"
                               label="Membership Status"
                               rules={[{required: true, message: 'Please select a membership status'}]}
                    >
                        <Select>
                            {Object.values(MembershipStatusEnum).map((type) => (
                                    <Select.Option key={type} value={type}>
                                        {type}
                                    </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Save
                        </Button>
                    </Form.Item>
                </Form>
            </div>
    );
}
