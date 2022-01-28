import { useCallback } from "react";
import { useProgrammingStore } from "../ProgrammingContext";
import { VisualBlock } from './VisualBlock';

export const PreviewBlock = ({ id, staticData, bounded, highlightColor }) => {
  const [data, typeSpec] = useProgrammingStore(
    useCallback(
      (state) => {
        const data = staticData ? staticData : state.programData[id] ? state.programData[id] : null;
        const typeSpec = state.programSpec.objectTypes[data?.type];
        const refData = data.ref ? state.programData[data.ref] : {};
        const selected = data?.selected || refData.selected;
        return [{...data,refData,selected}, typeSpec]
      },
      [id, staticData]
    )
  );
  
    if (!data) {
      return null;
    } else {
      return <VisualBlock data={data} typeSpec={typeSpec} interactionDisabled bounded={bounded} highlightColor={highlightColor}/>;
    }
  };