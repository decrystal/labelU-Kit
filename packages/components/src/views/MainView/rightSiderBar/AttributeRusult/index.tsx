import type { FC, ReactElement } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Collapse, Form, Input, Popconfirm, Select } from 'antd';
import { connect, useDispatch } from 'react-redux';
import type { PrevResult, Attribute } from '@label-u/annotation';
import { EToolName } from '@label-u/annotation';
import classNames from 'classnames';

import AttributeEditorIcon from '@/assets/cssIcon/attribute_editor.svg';
import AttributeShowIcon from '@/assets/cssIcon/attribute_show.svg';
import AttributeUnionIcon from '@/assets/cssIcon/attribute_union.svg';
import emptyAttributeImg from '@/assets/common/emptyAttribute.png';
import AttributeHideIcon from '@/assets/common/attribute_hide.svg';
import { ChangeCurrentTool, UpdateImgList } from '@/store/annotation/actionCreators';
import type { ToolInstance } from '@/store/annotation/types';
import DrageModel from '@/components/dragModal';
import type { IFileItem } from '@/types/data';

import { toolList } from '../../toolHeader/ToolOperation';
import type { AppState } from '../../../../store';
import { labelTool } from '../../toolHeader/headerOption';
import { expandIconFuc } from '../TagSidebar';
import ClearResultIconHover from '../../../../assets/annotation/common/clear_result_hover.svg';
import ClearResultIcon from '../../../../assets/annotation/common/clear_result.svg';

const { Panel } = Collapse;
const { Option } = Select;

const LableTools = [EToolName.Rect, EToolName.Point, EToolName.Line, EToolName.Polygon];

interface AttributeResult {
  isVisible: boolean;
  attributeName: string;
  toolInfo: ToolInfo[];
}

interface ToolInfo {
  toolName: string;
  order: number;
  isVisible: boolean;
  icon: any;
  textAttribute: string;
}

interface IProps {
  isPreview: boolean;
  attributeList: Attribute[];
  imgIndex: number;
  imgList: IFileItem[];
  toolInstance: ToolInstance;
  copyToolInstance: ToolInstance;
  currentToolName: string;
  basicResultList: [];
  isShowClear: boolean;
}

const AttributeRusult: FC<IProps> = ({
  imgIndex,
  imgList,
  toolInstance,
  currentToolName,
  copyToolInstance,
  attributeList,
  basicResultList,
}) => {
  const [attributeResultList, setAttributeResultList] = useState<AttributeResult[]>([]);
  // const attributeShowRef = useRef<HTMLImageElement>(null);
  const dispatch = useDispatch();
  // 将标注结果转换为attributeResultList 格式
  const [content, setContent] = useState<ReactElement>(<div />);
  // 当前选中标签
  const [activeOrder, setActiveOrder] = useState<number>();
  // const [result,setResult] = useState();
  const [chooseToolInfo, setChooseToolInfo] = useState<ToolInfo>({
    toolName: '',
    order: -1,
    isVisible: true,
    icon: '',
    textAttribute: '',
  });
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isClearnHover, setIsClearHover] = useState<boolean>(false);
  // const [isShowClear, setIsShowClear] = useState(false);

  const initToolInfo = () => {
    const initStr = JSON.stringify({
      toolName: '',
      order: -1,
      isVisible: true,
      icon: '',
      textAttribute: '',
    });
    localStorage.setItem('toolInfo', initStr);
  };

  // 更新pre 标注结果
  const updateCanvasView = (newLabelResult: any) => {
    const prevResult: PrevResult[] = [];
    for (const oneTool of toolList) {
      if (oneTool.toolName !== currentToolName && newLabelResult[oneTool.toolName]) {
        const onePrevResult = {
          toolName: oneTool.toolName,
          result: newLabelResult[oneTool.toolName].result,
        };
        prevResult.push(onePrevResult);
      }
      if (oneTool.toolName === currentToolName) {
        toolInstance.setResult(newLabelResult[oneTool.toolName].result);
      }
    }
    toolInstance.setPrevResultList(prevResult);
    toolInstance.render();
  };

  // 删除标注结果
  const doClearAllResult = () => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    for (const tool of labelTool) {
      const tmpResult = oldImgResult[tool]?.result;
      if (tmpResult && tmpResult.length > 0) {
        oldImgResult[tool].result = [];
      }
    }
    imgList[imgIndex].result = JSON.stringify(oldImgResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(oldImgResult);
  };

  const handleOk = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      doClearAllResult();
      setOpen(false);
      setConfirmLoading(false);
    }, 100);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const dragModalRef = useRef<any>();
  useEffect(() => {
    initToolInfo();
  }, []);

  const showPopconfirm = () => {
    setOpen(true);
  };

  const [boxHeight, setBoxHeight] = useState<number>();
  const [, setBoxWidth] = useState<number>();

  useEffect(() => {
    const boxParent = document.getElementById('annotationCotentAreaIdtoGetBox')?.parentNode as HTMLElement;
    setBoxHeight(boxParent.clientHeight);
    setBoxWidth(boxParent.clientWidth);
  }, []);

  // 工具选中后联动标注结果选中项
  useEffect(() => {
    const activeId =
      currentToolName === EToolName.Rect
        ? // @ts-ignore
          copyToolInstance?.selectedRectID
        : // @ts-ignore
          copyToolInstance?.selectedID;
    if (activeId && imgList && imgList.length > imgIndex) {
      const toolInfoStr = localStorage.getItem('toolInfo');
      if (toolInfoStr && toolInfoStr.length > 0) {
        const imgResult = JSON.parse(imgList[imgIndex].result as string);
        for (const item of imgResult[currentToolName]?.result) {
          if (item.id === activeId) {
            setActiveOrder(item.order);
          }
        }
      }
    } else {
      setActiveOrder(0);
    }
    // @ts-ignore
  }, [copyToolInstance, currentToolName, imgIndex, imgList]);

  useEffect(() => {
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      const currentImgResult = JSON.parse(imgList[imgIndex].result as string);
      const resultKeys = Object.keys(currentImgResult);
      const tmpAttributeResult: AttributeResult[] = [];
      const attributeMap = new Map();
      for (const item of toolList) {
        if (resultKeys.indexOf(item.toolName) >= 0 && item.toolName !== 'tagTool') {
          const result = currentImgResult[item.toolName].result;
          if (result && Array.isArray(result)) {
            for (const oneLabel of result) {
              // eslint-disable-next-line max-depth
              let isExistInTmpToolInfo = false;
              if (attributeMap.has(oneLabel.attribute)) {
                const tmpToolInfo = attributeMap.get(oneLabel.attribute);
                // 去重
                for (let i = 0; i < tmpToolInfo.length; i++) {
                  if (tmpToolInfo[i].order === oneLabel.order) {
                    isExistInTmpToolInfo = true;
                  }
                }

                if (!isExistInTmpToolInfo) {
                  tmpToolInfo.push({
                    toolName: item.toolName,
                    order: oneLabel.order,
                    icon: item.commonSvg,
                    isVisible: oneLabel.isVisible,
                    textAttribute: oneLabel.textAttribute,
                  });
                }
              } else {
                attributeMap.set(oneLabel.attribute, [
                  {
                    toolName: item.toolName,
                    order: oneLabel.order,
                    icon: item.commonSvg,
                    isVisible: oneLabel.isVisible,
                    textAttribute: oneLabel.textAttribute,
                  },
                ]);
              }
            }
          }
        }
      }
      // 初始化attributeResultList
      for (const key of attributeMap.keys()) {
        const toolInfo = attributeMap.get(key);
        let isVisible = false;
        if (toolInfo && toolInfo.length > 0) {
          for (const tool of toolInfo) {
            if (tool.isVisible) {
              isVisible = true;
              break;
            }
          }
        }
        tmpAttributeResult.push({
          isVisible: isVisible,
          attributeName: key,
          toolInfo: attributeMap.get(key),
        });
      }
      setAttributeResultList(tmpAttributeResult);
    }
  }, [imgList, imgIndex]);

  // 修改标注描述信息 || 修改是否可以显示
  const updateLabelResult = (toolInfo: ToolInfo) => {
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      // 更新结果
      if (oldImgResult[toolInfo.toolName].result && oldImgResult[toolInfo.toolName].result.length > 0) {
        const newToolLabelItems = oldImgResult[toolInfo.toolName].result.map(
          (item: { order: number; isVisible: boolean }) => {
            if (item.order === toolInfo.order) {
              return {
                ...item,
                isVisible: toolInfo.isVisible,
                textAttribute: toolInfo.textAttribute,
              };
            }
            return item;
          },
        );
        oldImgResult[toolInfo.toolName].result = newToolLabelItems;
      }
      imgList[imgIndex].result = JSON.stringify(oldImgResult);
      dispatch(UpdateImgList(imgList));
      updateCanvasView(oldImgResult);
    }
  };

  // 批量修改是否可以显示
  const updateLabelsResult = (attributeResult: AttributeResult) => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    // 更新标注结果
    let newToolInfo: ToolInfo[] = [];
    if (attributeResult.toolInfo.length > 0) {
      newToolInfo = attributeResult.toolInfo.map((item) => {
        return { ...item, isVisible: attributeResult.isVisible };
      });
    }
    attributeResult.toolInfo = newToolInfo;
    const newAttributeResultList = attributeResultList.map((item) => {
      if (item.attributeName === attributeResult.attributeName) {
        return { ...attributeResult };
      }
      return item;
    });
    setAttributeResultList(newAttributeResultList);
    // 更新显示结果
    if (attributeResult.toolInfo && attributeResult.toolInfo.length > 0) {
      for (const oneTool of attributeResult.toolInfo) {
        if (oldImgResult[oneTool.toolName].result && oldImgResult[oneTool.toolName].result.length > 0) {
          const newToolLabelItems = oldImgResult[oneTool.toolName].result.map(
            (item: { order: number; isVisible: boolean }) => {
              if (item.order === oneTool.order) {
                return {
                  ...item,
                  isVisible: attributeResult.isVisible,
                };
              }
              return item;
            },
          );
          oldImgResult[oneTool.toolName].result = newToolLabelItems;
        }
      }
      imgList[imgIndex].result = JSON.stringify(oldImgResult);
      dispatch(UpdateImgList(imgList));
      updateCanvasView(oldImgResult);
    }
  };

  // 批量删除标注
  const deleteLabelByAttribute = (attributeResult: AttributeResult) => {
    const getPositionIndexInArr = (arr: number[], value: number) => {
      let p = 0;
      if (arr?.length > 0) {
        while (p < arr.length) {
          if (value >= arr[p]) {
            p++;
          } else {
            break;
          }
        }
      }
      return p;
    };

    if (attributeResult && attributeResult.toolInfo && attributeResult.toolInfo.length > 0) {
      // 获取删除标注结果order 数组
      const deleteResult = attributeResult.toolInfo
        .map((item) => {
          return item.order;
        })
        .sort((a, b) => a - b);

      const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      const newImgResult = { ...oldImgResult };
      // 获取已用工具列表
      const keys = Object.keys(oldImgResult);
      const toolList_ = keys.filter((item) => {
        return LableTools.indexOf(item as EToolName) >= 0;
      });

      for (let i = 0; i < toolList_.length; i++) {
        newImgResult[toolList_[i]].result = oldImgResult[toolList_[i]].result.reduce(
          (res: { order: number; isVisible: boolean }[], item: { order: number; isVisible: boolean }) => {
            if (deleteResult.indexOf(item.order) < 0) {
              item.order = item.order - getPositionIndexInArr(deleteResult, item.order);
              res.push(item);
            }
            return res;
          },
          [],
        );
      }
      imgList[imgIndex].result = JSON.stringify(newImgResult);
      dispatch(UpdateImgList(imgList));
      updateCanvasView(newImgResult);
    }
  };

  // 删除标注
  const delelteLabel = (toolInfo: ToolInfo) => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    const newImageResult = { ...oldImgResult };
    // 更新结果
    if (oldImgResult[toolInfo.toolName].result && oldImgResult[toolInfo.toolName].result.length > 0) {
      // 获取已用工具列表
      const keys = Object.keys(oldImgResult);
      const toolList_ = keys.filter((item) => {
        return LableTools.indexOf(item as EToolName) >= 0;
      });

      for (let i = 0; i < toolList_.length; i++) {
        newImageResult[toolList_[i]].result = oldImgResult[toolList_[i]].result.reduce(
          (res: { order: number; isVisible: boolean }[], item: { order: number; isVisible: boolean }) => {
            if (item.order !== toolInfo.order) {
              if (item.order > toolInfo.order) {
                item.order = item.order - 1;
              }
              res.push(item);
            }
            return res;
          },
          [],
        );
      }
    }
    imgList[imgIndex].result = JSON.stringify(newImageResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(newImageResult);
  };

  // 根据标签及工具 修改标签及描述
  const updateLabelResultByOrderAndToolName = (
    order: number,
    fromToolName: string,
    toAttributeName: string,
    toAttributeText: string,
  ) => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    // 更新结果
    if (oldImgResult[fromToolName].result && oldImgResult[fromToolName].result.length > 0) {
      const newToolLabelItems = oldImgResult[fromToolName].result.map(
        (item: { order: number; isVisible: boolean; attribute: string; textAttribute: string }) => {
          if (item.order === order) {
            return {
              ...item,
              attribute: toAttributeName,
              textAttribute: toAttributeText,
            };
          }
          return item;
        },
      );
      oldImgResult[fromToolName].result = newToolLabelItems;
    }
    imgList[imgIndex].result = JSON.stringify(oldImgResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(oldImgResult);
  };

  // 设置选中线条
  const setSelectedLabel = (toolInfo: ToolInfo) => {
    // 选中当前标注
    const toolInfoStr = JSON.stringify(toolInfo);
    localStorage.setItem('toolInfo', toolInfoStr);
    // 切换工具
    dispatch(ChangeCurrentTool(toolInfo.toolName));
    setChooseToolInfo(toolInfo);
  };

  useEffect(() => {
    if (imgList && basicResultList && imgList.length > imgIndex) {
      const toolInfoStr = localStorage.getItem('toolInfo');
      // 获取basicReuslt 有哪几种标注结果
      const basicResultTools = basicResultList.reduce((res, item: { toolName: string }) => {
        res.push(item.toolName);
        return res;
      }, [] as string[]);

      if (toolInfoStr && toolInfoStr.length > 0) {
        const chooseToolInfo_ = JSON.parse(toolInfoStr as string);
        const imgResult = JSON.parse(imgList[imgIndex].result as string);
        if (
          toolInstance &&
          chooseToolInfo_.toolName &&
          chooseToolInfo_.toolName === currentToolName &&
          basicResultTools.indexOf(chooseToolInfo_.toolName) < 0 &&
          imgResult[chooseToolInfo_.toolName].result &&
          imgResult[chooseToolInfo_.toolName].result.length > 0
        ) {
          for (const item of imgResult[chooseToolInfo_.toolName].result) {
            if (item.order === chooseToolInfo_.order) {
              // eslint-disable-next-line max-depth
              if (chooseToolInfo_.toolName === EToolName.Line) {
                // @ts-ignore
                toolInstance?.setActiveAreaByPoint(item?.pointList[0]);
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo_.toolName === EToolName.Point) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo_.toolName === EToolName.Polygon) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // 选中之后，重新初始化
                initToolInfo();
              } else if (chooseToolInfo_.toolName === EToolName.Rect) {
                // @ts-ignore
                toolInstance?.setSelectedID(item.id);
                // 选中之后，重新初始化
                initToolInfo();
              }
            }
          }
        }
      }
    }
  }, [toolInstance, basicResultList, chooseToolInfo, imgList, imgIndex, currentToolName]);

  const defaultKeys = useMemo(() => {
    const keys = attributeResultList.map((attribute) => {
      return attribute.attributeName;
    });
    return keys;
  }, [attributeResultList]);

  const generateContent = (toolInfo: ToolInfo, attributeResult: AttributeResult) => {
    const children = [];
    for (const item of attributeList) {
      // eslint-disable-next-line react/jsx-no-undef
      children.push(<Option key={item.key}>{item.value}</Option>);
    }
    children.push(<Option key={'无标签'}>无标签</Option>);
    return (
      <Form
        name="basic"
        layout="vertical"
        key={new Date().getTime()}
        initialValues={{
          changeAttribute: attributeResult.attributeName,
          description: toolInfo.textAttribute,
        }}
        autoComplete="off"
        onFieldsChange={(_, allFields) => {
          updateLabelResultByOrderAndToolName(
            toolInfo.order,
            toolInfo.toolName,
            allFields[0].value,
            allFields[1].value,
          );
        }}
      >
        <Form.Item
          label="标签"
          name="changeAttribute"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            value={attributeResult.attributeName}
            style={{
              width: '100%',
            }}
          >
            {children}
          </Select>
        </Form.Item>
        <Form.Item
          label="描述"
          name="description"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.TextArea value={toolInfo.textAttribute} />
        </Form.Item>
      </Form>
    );
  };

  if (!attributeResultList || attributeResultList.length === 0 || !boxHeight) {
    return (
      <div className="containerBox" style={{ height: (boxHeight as number) - 220 }}>
        <img className="emptyAttributeImg" src={emptyAttributeImg} />
      </div>
    );
  }
  return (
    <div
      style={{ height: (boxHeight as number) - 220 }}
      className={classNames({
        attributeResult: true,
      })}
    >
      <DrageModel title="详细信息" ref={dragModalRef} width={333} okWord="确认" cancelWord="取消" content={content} />
      <Collapse key={defaultKeys.join('')} defaultActiveKey={defaultKeys} expandIcon={expandIconFuc}>
        {attributeResultList &&
          attributeResultList.length > 0 &&
          attributeResultList.map((item) => {
            return (
              <Panel
                header={
                  <div className="attributeResultLi">
                    <span
                      title={item.attributeName}
                      style={{
                        marginRight: '36px',
                        width: '84px',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      {item.attributeName}
                    </span>{' '}
                    <div className="attributeResultRightImgBox">
                      {item.isVisible ? (
                        <img
                          className="hoverShow"
                          id={`${item.attributeName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLabelsResult({ ...item, isVisible: false });
                            // const newTItem = { ...item, isVisible: false };
                            // updateLabelVisible(tItem, false);
                            // updateLabelResult(newTItem);
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            // attributeShowRef.current?.setAttribute('src', AttributeShowHoverIcon);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            // attributeShowRef.current?.setAttribute('src', AttributeShowIcon);
                          }}
                          src={AttributeShowIcon}
                          style={{ marginRight: '10px' }}
                        />
                      ) : (
                        <img
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLabelsResult({ ...item, isVisible: true });
                            // updateLabelVisible(tItem, true);
                          }}
                          src={AttributeHideIcon}
                          style={{ marginRight: '10px' }}
                        />
                      )}
                      <img
                        src={AttributeUnionIcon}
                        className="hoverShow"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLabelByAttribute(item);
                        }}
                      />
                    </div>
                  </div>
                }
                key={item.attributeName}
              >
                {item.toolInfo &&
                  item.toolInfo.length > 0 &&
                  item.toolInfo.map((tItem) => {
                    return (
                      <div
                        // key={item.attributeName}
                        key={tItem.toolName + tItem.order}
                        className={classNames({
                          attributeResultLi: true,
                          attributeResultLiActive: tItem.order === activeOrder,
                        })}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLabel(tItem);
                        }}
                      >
                        <span>{tItem.order}.</span>
                        <img src={tItem.icon} style={{ marginLeft: '5px', marginRight: '5px' }} />
                        <span
                          title={item.attributeName}
                          style={{
                            marginRight: '36px',
                            width: '84px',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                          }}
                        >
                          {item.attributeName}
                        </span>
                        <div className="attributeResultRightImgBox">
                          <img
                            id={`${tItem.toolName + tItem.order} + edit`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // @ts-ignore
                              const boundingClientRect = document
                                .getElementById(`${tItem.toolName + tItem.order} + edit`)
                                .getBoundingClientRect();
                              const tmpBounds = {
                                left: boundingClientRect.left - 50,
                                top: boundingClientRect.top,
                              };

                              dragModalRef.current.switchModal(true);
                              dragModalRef.current.switchSetBounds(tmpBounds);
                              setContent(generateContent(tItem, item));
                            }}
                            src={AttributeEditorIcon}
                            className="hoverShow"
                            style={{ left: 10, position: 'absolute' }}
                          />
                          {tItem.isVisible ? (
                            <img
                              className="hoverShow"
                              id={`${tItem.toolName + tItem.order}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTItem = { ...tItem, isVisible: false };
                                // updateLabelVisible(tItem, false);
                                updateLabelResult(newTItem);
                              }}
                              // onMouseEnter={(e) => {
                              //   e.stopPropagation();
                              //   document
                              //     .getElementById(`${tItem.toolName + tItem.order}`)
                              //     ?.setAttribute('src', AttributeShowHoverIcon);

                              // }}
                              onMouseLeave={(e) => {
                                e.stopPropagation();
                                // attributeShowRef.current?.setAttribute('src', AttributeShowIcon);
                                document
                                  .getElementById(`${tItem.toolName + tItem.order}`)
                                  ?.setAttribute('src', AttributeShowIcon);
                              }}
                              src={AttributeShowIcon}
                              style={{ left: 30, position: 'absolute' }}
                            />
                          ) : (
                            <img
                              onClick={(e) => {
                                e.stopPropagation();
                                // updateLabelVisible(tItem, true);
                                const newTItem = { ...tItem, isVisible: true };
                                updateLabelResult(newTItem);
                              }}
                              src={AttributeHideIcon}
                              style={{ left: 30, position: 'absolute' }}
                            />
                          )}
                          <img
                            style={{ left: 50, position: 'absolute' }}
                            src={AttributeUnionIcon}
                            className="hoverShow"
                            onClick={(e) => {
                              e.stopPropagation();
                              delelteLabel(tItem);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                <Popconfirm
                  title="确认清空标注？"
                  open={open}
                  okText="确认"
                  cancelText="取消"
                  onConfirm={handleOk}
                  okButtonProps={{ loading: confirmLoading }}
                  onCancel={handleCancel}
                >
                  <div className="rightBarFooter">
                    <img
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setIsClearHover(true);
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        setIsClearHover(false);
                      }}
                      onClick={showPopconfirm}
                      className="clrearResult"
                      src={isClearnHover ? ClearResultIconHover : ClearResultIcon}
                    />
                  </div>
                </Popconfirm>
              </Panel>
            );
          })}
      </Collapse>
    </div>
  );
};

const getStateMap = (state: AppState) => {
  return {
    imgList: [...state.annotation.imgList],
    imgIndex: state.annotation.imgIndex,
    toolInstance: state.annotation.toolInstance,
    copyToolInstance: { ...state.annotation.toolInstance },
    currentToolName: state.annotation.currentToolName,
    attributeList: state.annotation.toolInstance.config.attributeList,
    basicResultList: state.annotation.basicResultList,
  };
};

export default connect(getStateMap)(AttributeRusult);
