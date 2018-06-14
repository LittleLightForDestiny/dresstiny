<template>
<div class="selector">
	<div class="title" v-on:click="$emit('close')">
		Close
	</div>
	<div class="item" v-for="item in list" :style="nameStyle(item)" v-on:click="selectItem(item)">
		<div class="item-icon" :style="iconStyle(item)"></div>
		<div class="item-name">{{item.name}}</div>
	</div>
</div>
</template>
<script>
export default {
	computed:{
		filteredList(){
			if(!this.list) return [];
			return this.list.filter((item)=>{
				return item.itemSubType == this.itemSubType &&
					item.classType == this.classType;
			}).sort((itemA, itemB)=>{
				return itemB.tierType - itemA.tierType;
			})
		}
	},
	methods:{
		nameStyle(item){
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
		},
		iconStyle(item){
			let style = {backgroundImage:`url(http://bungie.net/${item.icon})`};
			return style;
		},
		selectItem(item){
			window.dispatchEvent(new CustomEvent("changeItem", {detail:{item:item}}));
			this.$emit('close');
		}
	},
	props:{
		open:{
			type:Boolean
		},
		item:{
			type:Object
		},
		type:{
			type:String
		},
		itemSubType:{
			type:Number
		},
		list:{
			type:Array
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
.item {
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
.item-name{
	padding:8px;
}
</style>
