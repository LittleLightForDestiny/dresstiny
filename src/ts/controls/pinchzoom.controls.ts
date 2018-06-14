import {Vector2} from "three";
export class PinchZoomControls{
	private domElement:HTMLElement;
	private window:Window;
	lastDistance:number = null;
	doubleTapTimeout:boolean = false;
	disableMoveTimeout:boolean = false;

	constructor(domElement?: HTMLElement, domWindow?: Window){
		this.domElement = (domElement !== undefined) ? domElement : document.body;
		this.window = (domWindow !== undefined) ? domWindow : window;
		this.domElement.addEventListener("touchstart", this.touchStartListener, {passive:true});
		this.window.addEventListener("touchmove", this.touchMoveListener);
		this.window.addEventListener("touchend", this.touchEndListener);
	}

	touchStartListener:EventListener = (event:TouchEvent)=>{
		if(event.touches.length == 1){
			this.domElement.dispatchEvent(new MouseEvent("mousedown", {clientX:event.touches[0].clientX, clientY:event.touches[0].clientX}));
			if(this.doubleTapTimeout){
				this.domElement.dispatchEvent(new MouseEvent("doubletap", null));
			}else{
				this.doubleTapTimeout = true;
				setTimeout(()=>{
					this.doubleTapTimeout = false;
				}, 200);
			}
		}
		if(event.touches.length != 2) return;
		let point1 = new Vector2(event.touches[0].clientX, event.touches[0].clientY);
		let point2 = new Vector2(event.touches[1].clientX, event.touches[1].clientY);
		this.lastDistance = point1.distanceTo(point2);
	}

	touchMoveListener:EventListener = (event:TouchEvent)=>{
		if(this.disableMoveTimeout) return;
		if(event.touches.length == 1){
			this.window.dispatchEvent(new MouseEvent("mousemove", {clientX:event.touches[0].clientX, clientY:event.touches[0].clientY}));
		}
		if(event.touches.length < 2) return;
		let point1 = new Vector2(event.touches[0].clientX, event.touches[0].clientY);
		let point2 = new Vector2(event.touches[1].clientX, event.touches[1].clientY);
		let distance = point1.distanceTo(point2);
		this.domElement.dispatchEvent(new WheelEvent("mousewheel", {deltaY:-100*(distance/this.lastDistance - 1)}));
		this.lastDistance = distance;
	}

	touchEndListener:EventListener = (event:TouchEvent)=>{
		if(event.touches.length == 0){
			this.window.dispatchEvent(new MouseEvent("mouseup"));
		}
		if(event.touches.length == 1){
			this.disableMoveTimeout = true;
			setTimeout(()=>{
				this.disableMoveTimeout = false;
			},50);
		}
	}
}
