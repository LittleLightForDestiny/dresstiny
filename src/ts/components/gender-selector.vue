<template>
<div class="selector">
	<div class="title">
		Class
	</div>
	<div class="buttons">
		<div class="button" :class="selected==0 ? 'selected': ''" v-on:click="changeClass(0)">
			Male
		</div>
		<div class="button" :class="selected==1 ? 'selected': ''" v-on:click="changeClass(1)">
			Female
		</div>
	</div>
</div>
</template>
<script>
export default {
	props:{
		selected:{
			type:Number,
			default:null
		}
	},
	methods:{
		changeClass(gender){
			if(gender == this.selected) return;
			let event = new CustomEvent("changeGender",{detail:{gender:gender}});
			window.dispatchEvent(event);
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
.buttons {
    display: flex;
    flex-flow: row;
	border-bottom: #CCCCCC solid 4px;
}
.button {
	flex-grow: 2;
    width: 33%;
    text-align: center;
    padding: 8px;
    background-color: #666666;
    color: white;
    text-transform: uppercase;
    font-size: 13px;
	cursor:pointer;
	&.selected{
		background-color: #999999;
		color: #FFD700;
		pointer-events: none;
	}
}
</style>
