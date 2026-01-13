/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Gallery } from 'react-photoswipe-gallery';
import { Button } from 'semantic-ui-react';
import { useToggle } from '../../../lib/hooks';

import selectors from '../../../selectors';
import { ClosableContext } from '../../../contexts';
import Item from './Item';

import styles from './Attachments.module.scss';

const INITIALLY_VISIBLE = 2;

const Attachments = React.memo(() => {
  const attachments = useSelector(selectors.selectAttachmentsForCurrentCard);

  const [t] = useTranslation();
  const [isAllVisible, toggleAllVisible] = useToggle();
  const [activateClosable, deactivateClosable] = useContext(ClosableContext);

  const handleBeforeGalleryOpen = useCallback(
    (gallery) => {
      activateClosable();

      gallery.on('destroy', () => {
        deactivateClosable();
      });
    },
    [activateClosable, deactivateClosable],
  );

  const handleToggleAllVisibleClick = useCallback(() => {
    toggleAllVisible();
  }, [toggleAllVisible]);

  let visibleTotal = 0;

  const itemsNode = attachments.map((attachment) => {
    let isVisible = false;
    if (isAllVisible || visibleTotal < INITIALLY_VISIBLE) {
      visibleTotal += 1;
      isVisible = true;
    }

    return <Item key={attachment.id} id={attachment.id} isVisible={isVisible} />;
  });

  const hiddenTotal = attachments.length - visibleTotal;

  return (
    <>
      <Gallery
        withCaption
        withDownloadButton
        options={{
          wheelToZoom: true,
          showHideAnimationType: 'none',
          closeTitle: '',
          zoomTitle: '',
          arrowPrevTitle: '',
          arrowNextTitle: '',
          errorMsg: '',
          paddingFn: (viewportSize) => {
            const paddingX = viewportSize.x / 20;
            const paddingY = viewportSize.y / 20;

            return {
              top: paddingX,
              bottom: paddingX,
              left: paddingY,
              right: paddingY,
            };
          },
        }}
        onBeforeOpen={handleBeforeGalleryOpen}
      >
        <div className={styles.grid}>{itemsNode}</div>
      </Gallery>
      {(isAllVisible ? attachments.length > hiddenTotal : hiddenTotal > 0) && (
        <Button
          fluid
          content={
            isAllVisible
              ? t('action.showFewerAttachments')
              : t('action.showAllAttachments', {
                  hidden: hiddenTotal,
                })
          }
          className={styles.toggleButton}
          onClick={handleToggleAllVisibleClick}
        />
      )}
    </>
  );
});

Attachments.propTypes = {};

Attachments.defaultProps = {};

export default Attachments;
