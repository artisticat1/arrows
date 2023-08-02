The leader-line library does not support custom arrowheads. Therefore, to achieve rounded arrowheads, we replace the definitions of `arrow1` and `arrow2` in `LeaderLine.js` with

```
<path id="leader-line-arrow1" d="M-4.34-10.416c-.563.024-1.007.388-1.23.799-.224.41-.284.903-.135 1.388L-3.185 0l-2.52 8.229a1.755 1.755 0 0 0 .36 1.705c.397.438 1.206.638 1.802.271l14.307-8.762h.002c.546-.336.765-.917.765-1.443s-.22-1.107-.765-1.443h-.002l-14.305-8.762a1.418 1.418 0 0 0-.797-.211z"/><path id="leader-line-arrow2" d="M-4.34-10.416c-.563.024-1.007.388-1.23.799-.224.41-.284.903-.135 1.388L-3.185 0l-2.52 8.229a1.755 1.755 0 0 0 .36 1.705c.397.438 1.206.638 1.802.271l14.307-8.762h.002c.546-.336.765-.917.765-1.443s-.22-1.107-.765-1.443h-.002l-14.305-8.762a1.418 1.418 0 0 0-.797-.211z"/>
```

and adjust their spacing parameters to

```
arrow1:{elmId:"leader-line-arrow1",bBox:{left:-7,top:-11,width:19,height:22,right:12,bottom:11},widthR:4.75,heightR:5.5,bCircle:12,sideLen:11,backLen:7,overhead:0,outlineBase:2,outlineMax:1.5},arrow2:{elmId:"leader-line-arrow2",bBox:{left:-7,top:-11,width:19,height:22,right:12,bottom:11},widthR:4.75,heightR:5.5,bCircle:12,sideLen:11,backLen:7,overhead:12,outlineBase:1,outlineMax:1.75}
```

Furthermore, the type definitions for LeaderLine are modified to account for PointAnchors:
```
start:HTMLElement|PointAnchor;
end:HTMLElement|PointAnchor;
```

To solve errors when resizing the window and arrows have been removed, comment out these lines in `index.js`:
```
// this.#onResize=()=>{requestAnimationFrame(()=>{this.position()})};
// window.addEventListener("resize",this.#onResize);
```
