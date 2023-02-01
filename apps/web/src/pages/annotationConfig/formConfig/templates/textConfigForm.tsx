import { TextConfig } from '@label-u/components';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { Form } from 'antd';
import TextList from '../../components/TextList';
import { useForm } from 'antd/lib/form/Form';
import { delayTime } from '../constants';

interface TextConfigProp {
  textConfig: TextConfig;
}

const TextConfigForm: FC<TextConfigProp & { name: string }> = props => {
  const [form] = useForm();
  const formItemLayout = {
    labelCol: {
      xs: {
        span: 24
      },
      sm: {
        span: 4
      }
    },
    wrapperCol: {
      xs: {
        span: 24
      },
      sm: {
        span: 16
      }
    }
  };

  const [initVal, setInitVal] = useState<TextConfig>([
    {
      label: '文本',
      key: 'text',
      required: false,
      default: '',
      maxLength: 1000
    }
  ]);

  // @ts-ignore
  const formSubmitThrottle = window.throttle(() => {
    form.submit();
  }, 1);

  useMemo(() => {
    if (props) {
      let initV =
        // @ts-ignore
        props.textConfig && props.textConfig.length > 0
          ? // @ts-ignore
            props.textConfig
          : [
              {
                label: '文本',
                key: 'text',
                required: false,
                default: '',
                maxLength: 1000
              }
            ];
      setInitVal(initV);
    }
  }, []);
  const { children } = props;



  return (
    <div className="selectedMain" style={{ paddingLeft: 24 }}>
      <Form {...formItemLayout} name={props.name} form={form} onBlur={formSubmitThrottle}>
        <Form.Item name="textConfig" initialValue={initVal}>
          <TextList
            value={[...initVal]}
            onChange={e => {
              form.setFieldsValue({ textConfig: e });
              setInitVal(e);
            }}
            onDelete={
              e => {
                form.setFieldsValue({ textConfig: e });
                setInitVal(e);
                formSubmitThrottle()
              }
            }
            onAdd={
              e => {
                form.setFieldsValue({ textConfig: e });
                setInitVal(e);
                formSubmitThrottle()
              }
            }
          />
        </Form.Item>
      </Form>
      {children}
    </div>
  );
};

export default TextConfigForm;
