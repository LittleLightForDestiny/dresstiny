<template>
<div class="selector">
	<div class="title">
		{{type}}
	</div>
	<div class="item" :style="nameStyle(item)" v-on:click="openSelector(itemSubType, false)">
		<div class="item-icon" :style="iconStyle(item)"></div>
		<div class="item-label">
			<div class="item-name">{{name(item)}}</div>
			<div class="item-hash">{{hash(item)}}</div>
		</div>
	</div>
	<div class="shader" :style="nameStyle(shader)" v-on:click="openSelector(itemSubType, true)">
		<div class="item-icon" :style="iconStyle(shader)"></div>
		<div class="item-label">
			<div class="item-name">{{name(shader)}}</div>
			<div class="item-hash">{{hash(shader)}}</div>
		</div>
	</div>
</div>
</template>
<script>
export default {
	computed:{
	},
	methods:{
		openSelector(subType, isShader){
			let event = new CustomEvent("openSelector",{detail:{itemSubType:subType, isShader:isShader}});
			window.dispatchEvent(event);
		},
		iconStyle(item){
			if(!item) return '';
			let style = {backgroundImage:`url(http://bungie.net/${item.icon})`};
			return style;
		},
		hash(item){
			if(!item) return "";
			return item.hash;
		},
		name(item){
			if(!item) return "";
			return item.name;
		},
		nameStyle(item){
			if(!item){
				return {};
			}
			let color = "#C3BCB4";
			switch(item.tierType){
				case 3:
					color = "#306B3D";
				break;
				case 4:
					color = "#5076A3";
				break;
				case 5:
					color = "#522F65";
				break;
				case 6:
					color = "#CEAE33";
				break;
			}
			return {backgroundColor:color};
		}
	},
	props:{
		item:{
			type:Object
		},
		shader:{
			type:Object
		},
		type:{
			type:String
		},
		itemSubType:{
			type:Number
		}
	}
}
</script>
<style lang="scss" scoped>
.title {
    text-transform: uppercase;
    font-size: 10px;
    padding: 4px 8px;
    background-color: #333333;
    color: white;
}
.shader, .item {
	color:white;
    display: flex;
    flex-flow: row;
	align-items: center;
	border-bottom: #CCCCCC solid 4px;
	padding:4px;
	font-size: 12px;
	text-transform: uppercase;
}
.item-icon{
	width:54px;
	height:54px;
	border:2px solid white;
	background-position: center;
	background-size: cover;
}
.item-label{
	padding:8px;
}

.item-hash{
	font-size:10px;
	font-weight: lighter;
}

</style>
