import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Divider } from 'antd/es';
import { useTranslation } from 'react-i18next';

import type { GraphToolInstance } from '@/store/annotation/types';
import type { AppState } from '@/store';

interface IProps {
  toolInstance: GraphToolInstance;
}

const PageNumber = (props: IProps) => {
  const { toolInstance } = props;
  const [, forceRender] = useState(0);
  const { t } = useTranslation();
  useEffect(() => {
    if (toolInstance) {
      toolInstance.singleOn('updatePageNumber', () => {
        forceRender((s) => s + 1);
      });
    }
  }, [toolInstance]);

  if (!toolInstance) {
    return null;
  }

  const count = toolInstance?.currentPageResult?.length;
  if (count >= 0) {
    return (
      <span>
        {`${t('ItemsOfThisPage')}: ${count}`}
        <Divider type="vertical" style={{ background: 'rgba(153, 153, 153, 1)', height: '16px' }} />
      </span>
    );
  }

  return null;
};

const mapStateToProps = (state: AppState) => {
  return {
    toolInstance: state.annotation?.toolInstance,
  };
};

export default connect(mapStateToProps)(PageNumber);
