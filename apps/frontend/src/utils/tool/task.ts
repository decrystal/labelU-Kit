import { jsonParser } from './common';

export function findAllDependStep(step: number, stepList: any[]) {
  const dependStep = [];
  for (let i = 0; i < stepList.length; i++) {
    if (step === stepList[i].dataSourceStep) {
      dependStep.push(stepList[i].step);
    }
  }
  if (dependStep.length > 0) {
    dependStep.slice().forEach((v) => {
      dependStep.push(...findAllDependStep(v, stepList));
    });
    return dependStep;
  }
  return [];
}

// deleteList 逐步删除的步数；
export function reSortStepList(deleteList: number[], stepList: any[]) {
  const currentList = JSON.parse(JSON.stringify(stepList));
  for (let i = 0; i < deleteList.length; i++) {
    // j 是 stepList 的下标值
    for (let j = deleteList[i] - 1; j < currentList.length; j++) {
      currentList[j].step = currentList[j].step - 1;
      if (currentList[j].dataSourceStep > deleteList[i]) {
        currentList[j].dataSourceStep--;
      }
      if (currentList[j].type === 2) {
        currentList[j].name = `质检 - 步骤${currentList[j].dataSourceStep}`;
      }
    }
    currentList.splice(deleteList[i] - 1, 1);
  }
  return currentList;
}

/**
 * 更新 referenceStep 里面的参考显示数据
 *
 * @export
 * @param {number} step
 * @param {IStepConfig[]} stepList
 */
export function reloadStepListReferenceStep(step: number, stepList: any[]) {
  return stepList.map((v) => {
    const config = jsonParser(v?.config);

    if (typeof config?.referenceStep === 'number') {
      // 如果参考显示的步骤在删除步骤之后，则需要清除参考显示数据
      if (config?.referenceStep >= step) {
        return {
          ...v,
          config: JSON.stringify({ ...config, referenceStep: 0, referenceFilterData: {} }),
        };
      }
    }
    return v;
  });
}
