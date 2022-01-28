import { useProgrammingStore } from "../ProgrammingContext";
import { useDrop } from "react-dnd";
import { Block, PreviewBlock } from "./index";
import { useCallback } from "react";

const transferBlockSelector = (state) => state.transferBlock;

export const DropRegion = ({
  id,
  parentId,
  fieldInfo,
  idx,
  minHeight,
  hideText,
  disabled,
  highlightColor
}) => {
  const transferBlock = useProgrammingStore(transferBlockSelector);

  const data = useProgrammingStore(useCallback((store) => store.programData[id], [id]));

  const [dropProps, drop] = useDrop(
    () => ({
      accept: fieldInfo.accepts,
      drop: (item, _) => {
        transferBlock(item.data, item, {
          fieldInfo,
          parentId,
          idx
        });
      },
      canDrop: (item) => !disabled && !item.onCanvas,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        item: monitor.getItem()
      })
    }),
    [fieldInfo, parentId, idx, disabled]
  );

  const validDropType = fieldInfo.accepts.includes(dropProps.item?.data?.type) && !dropProps.item?.onCanvas;

  const renderedData = data
    ? data
    : dropProps.item && validDropType && !disabled && dropProps.isOver
    ? dropProps.item.data
    : null;

  const isPreview = renderedData && renderedData !== data;

  return (
    <div
      className="nodrag"
      ref={drop}
      style={{
        borderRadius: 4,
        backgroundColor:
          dropProps.isOver && validDropType
            ? "#44884488"
            : validDropType
            ? "#88888888"
            : null,
        minHeight: minHeight,
        minWidth: 190,
        display:'flex',
        flex:1
      }}
    >
      {renderedData && !isPreview ? (
        <Block
          staticData={renderedData}
          idx={idx}
          parentId={parentId}
          fieldInfo={fieldInfo}
          bounded
          highlightColor={highlightColor}
        />
      ) : renderedData ? (
        <PreviewBlock
          staticData={renderedData}
          idx={idx}
          parentId={parentId}
          fieldInfo={fieldInfo}
          bounded
          highlightColor={highlightColor}
        />
      ) : hideText ? null : (
        fieldInfo.name
      )}
    </div>
  );
};
