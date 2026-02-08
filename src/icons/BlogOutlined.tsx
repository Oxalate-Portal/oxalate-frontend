import Icon from '@ant-design/icons';
import type {CustomIconComponentProps} from '@ant-design/icons/lib/components/Icon';

const BlogSvg = () => (
        <svg
                viewBox="0 0 1024 1024"
                width="1em"
                height="1em"
                fill="currentColor">
            <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"/>
            <path d="M312 392h400c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H312c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 160h400c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H312c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 160h200c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H312c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z"/>
        </svg>
);

export const BlogOutlined = (props: Partial<CustomIconComponentProps>) => (
        <Icon component={BlogSvg} {...props} />
);
