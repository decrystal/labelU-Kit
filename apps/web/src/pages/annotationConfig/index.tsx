import { FC, useEffect, useState } from 'react';
import Annotation from '../../components/business/annotation';
import AnnotationOperation, { TextConfig } from '@label-u/components';
import './index.less';
// import { fileList as mockFileList, videoList } from '../../mock/annotationMock';
import YamlConfig from './yamlConfig';
import { shallowEqual, useSelector } from 'react-redux';
import { ToolsConfigState } from 'interface/toolConfig';
import { Button, Steps, Tabs } from 'antd';
import EmptyConfigImg from '../../img/annotationCommon/emptyConfig.png';
import ConfigTemplate from './configTemplate/index';
import FormConfig from './formConfig';
const { Step } = Steps;
interface OneFile {
  id: number;
  url: string;
  result: string;
}

const AnnotationConfig: FC = () => {
  const { tools, tagList, attribute, textConfig, fileInfo,commonAttributeConfigurable } = useSelector(state => state.toolsConfig, shallowEqual);
  const [rightImg, setRightImg] = useState<any>();
  const [isConfigError, setIsConfigError] = useState<boolean>(false);
  const [confitState, setConfigState] = useState<ToolsConfigState>({
    fileInfo: fileInfo,
    tools: tools,
    tagList: tagList,
    attribute: attribute,
    textConfig: textConfig,
    commonAttributeConfigurable:commonAttributeConfigurable
  });
  const [force, forceSet] = useState(0);
  const [fileList, setFileList] = useState<OneFile[]>([]);

  useEffect(() => {
    // 初始化配置防抖方法
    const throttle = (fun: () => void, time: number) => {
      let timmer: any;
      let returnFunction = () => {
        if (timmer) {
          clearTimeout(timmer);
        }
        timmer = setTimeout(() => {
          fun();
        }, time);
      };
      return returnFunction;
    };
    // @ts-ignore
    window.throttle = throttle;
    setRightImg(EmptyConfigImg);
  }, []);

  // const currentIsVideo = false;
  useEffect(() => {
    setConfigState({
      fileInfo: fileInfo,
      tools: tools,
      tagList: tagList,
      attribute: attribute,
      textConfig: textConfig,
      commonAttributeConfigurable:commonAttributeConfigurable
    });
    // 配置更新表单刷新
    forceSet(new Date().getTime());
  }, [attribute, tagList, textConfig, tools, fileInfo,commonAttributeConfigurable]);

  // 加载工具配置信息 和 文件信息
  useEffect(() => {
    if (fileInfo.list && fileInfo.list.length > 0) {
      // 配置标注文件 todo=》补充文件拉取接口
      let fList: OneFile[] = fileInfo.list.map((item: { url: any }, i: number) => ({
        id: i + 1,
        url: item.url,
        result: JSON.stringify([])
      }));
      setFileList(fList);
    }
  }, [fileInfo]);

  const goBack = (data: any) => {
  };

  const doSetImage = (img: any, isError: boolean) => {
    setRightImg(img);
    setIsConfigError(isError);
  };

  const extraContent = {
    left: <span className="leftTabContent">标注配置</span>,
    right: <ConfigTemplate />
  };
  return (
    <div className="container">
      <div className="headerBox">
        <div className="stepBox">
          <Steps size="small" current={2}>
            <Step title="基础配置" />
            <Step title="数据导入" />
            <Step title="标注配置" />
          </Steps>
        </div>
        <div className="submitBox">
          <Button>取消</Button>
          <Button
            type="primary"
            onClick={e => {
              e.stopPropagation();
            }}
          >
            完成
          </Button>
        </div>
      </div>
      <div className="configBox">
        <div className="leftSider" id="lefeSiderId">
          <Tabs
            defaultActiveKey="1"
            tabBarExtraContent={extraContent}
            type="card"
            onChange={e => {
              forceSet(new Date().getTime());
            }}
          >
            <Tabs.TabPane tab="YAML" key="1">
              <div className="leftPane">
                <YamlConfig toolsConfigState={confitState} doSetImg={doSetImage} key={force} />
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="可视化" key="2" forceRender={true}>
              <div className="leftPane">
                <FormConfig key={force} />
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
        <div className="rightSider">
          {((fileList && fileList.length > 0 && tools && tools.length > 0) || !rightImg) && !isConfigError ? (
            <>
              <div className="rightHeader">
                <span className="leftSpan">标注预览</span>
              </div>
              <div className='rightContent'>
                <AnnotationOperation
                  attributeList={commonAttributeConfigurable?attribute:[]}
                  tagConfigList={tagList}
                  imgList={fileList}
                  textConfig={textConfig}
                  goBack={goBack}
                  toolsBasicConfig={tools}
                />
              </div>
            </>
          ) : (
            <div className="notMatchBox">
              <img alt="not match config" src={rightImg} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnotationConfig;
