import { useState } from 'react';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

// 图片调整的刷子
import clearSmall from '@/assets/annotation/common/icon_clearSmall.svg';
// import clearSmallA from '@//assets/annotation/common/icon_clearSmall_a.svg';
import { InitImgAttribute } from '@/store/imgAttribute/actionCreators';
import { store } from '@/index';
import clearSmallA from '@//assets/annotation/common/icon_clearSmall_a.svg';

const ClearIcon = () => {
  const [hoverDelete, setHoverDelete] = useState(false);

  const clearAttribute = () => {
    store.dispatch(InitImgAttribute());
  };
  const { t } = useTranslation();

  return (
    <Tooltip placement="bottom" title={t('RestoreImageAttributes')}>
      <img
        onMouseEnter={() => setHoverDelete(true)}
        onMouseLeave={() => setHoverDelete(false)}
        style={{ marginLeft: 6 }}
        src={hoverDelete ? clearSmallA : clearSmall}
        onClick={(e) => {
          e.stopPropagation();
          clearAttribute();
        }}
      />
    </Tooltip>
  );
};

export default ClearIcon;
