<template>
<div class="selector">
	<div class="title">
		{{type}}
	</div>
	<div class="item" :style="nameStyle" v-on:click="openSelector()">
		<div class="item-icon" :style="iconStyle"></div>
		<div class="item-label">
			<div class="item-name">{{name}}</div>
			<div class="item-hash">{{hash}}</div>
		</div>
	</div>
</div>
</template>
<script>
export default {
	computed:{
		iconStyle(){
			if(!this.item) return '';
			let style = {backgroundImage:`url(http://bungie.net/${this.item.icon})`};
			return style;
		},
		hash(){
			if(!this.item) return "";
			return this.item.hash;
		},
		name(){
			if(!this.item) return "";
			if(!this.item.name){
				console.log(this.item);
			}
			return this.item.name;
		},
		nameStyle(){
			if(!this.item){
				return {};
			}
			let color = "#C3BCB4";
			switch(this.item.tierType){
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
	methods:{
		openSelector(){
			let event = new CustomEvent("openSelector",{detail:{itemSubType:this.itemSubType}});
			window.dispatchEvent(event);
		}
	},
	props:{
		item:{
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
.item-label{
	padding:8px;
}

.item-hash{
	font-size:10px;
	font-weight: lighter;
}

</style>
