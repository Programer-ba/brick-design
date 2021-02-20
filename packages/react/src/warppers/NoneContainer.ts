import { createElement, forwardRef, memo, useMemo } from 'react';
import {
	clearDropTarget,
	getComponentConfig,
	produce,
	ROOT,
	STATE_PROPS,
} from '@brickd/core';
import { useSelector } from '@brickd/redux-bridge';
import { merge } from 'lodash';
import { dataMapping} from '@brickd/utils';
import {
	CommonPropsType,
	controlUpdate,
	handleEvents,
	handlePropsClassName,
	HookState,
	propAreEqual,
	stateSelector,
} from '../common/handleFuns';
import {
	formatSpecialProps,
	generateRequiredProps,
	getComponent, isRenderComponent,
} from '../utils';
import { useSelect } from '../hooks/useSelect';
import { useDragDrop } from '../hooks/useDragDrop';
import { useGetState } from '../hooks/useGetState';
import { useService } from '../hooks/useService';
import { useComponentState } from '../hooks/useComponetState';

function NoneContainer(allProps: CommonPropsType, ref: any) {
	const {
		specialProps,
		specialProps: { key, domTreeKeys },
		isDragAddChild,
		...rest
	} = allProps;
	const { pageConfig: PageDom, propsConfigSheet } = useSelector<
		HookState,
		STATE_PROPS
	>(stateSelector, (prevState, nextState) =>
		controlUpdate(prevState, nextState, key),
	);

	const { isSelected } = useSelect(specialProps);
	const { dragSource, isHidden } = useDragDrop(key);
	const { dragKey, vDOMCollection } = dragSource || {};
	const pageConfig = PageDom[ROOT] ? PageDom : vDOMCollection || {};
	const { props:prevProps, componentName,state,api,isRender } = pageConfig[key] || {};
	useService(key,api);
	useComponentState(key,state);
	const { propsConfig } = useMemo(() => getComponentConfig(componentName), []);
	const pageState=useGetState(key);
	const props=useMemo(()=>dataMapping(prevProps,pageState),[pageState]);
	if (!componentName||isRenderComponent(isRender,pageState)) return null;

	const onDragEnter = (e: Event) => {
		e.stopPropagation();
		if (dragKey && domTreeKeys.includes(dragKey)) {
			clearDropTarget();
		}
	};

	const { className, animateClass, ...restProps } = props || {};
	return createElement(getComponent(componentName), {
		...restProps,
		className: handlePropsClassName(
			key,
			isHidden && !isDragAddChild,
			dragKey === key,
			className,
			animateClass,
		),
		...(isDragAddChild
			? {}
			: {
					onDragEnter,
					...handleEvents(specialProps, isSelected),
			  }),
		...generateRequiredProps(componentName),
		...formatSpecialProps(
			props,
			produce(propsConfig, (oldPropsConfig) => {
				merge(oldPropsConfig, propsConfigSheet[specialProps.key]);
			}),
		),
		draggable: true,
		/**
		 * 设置组件id方便抓取图片
		 */
		ref,
		...rest,
	});
}

export default memo<CommonPropsType>(forwardRef(NoneContainer), propAreEqual);
