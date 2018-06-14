<template>
<div class="selector">
	<div class="title">
		Deeplink
	</div>
	<div class="buttons">
		<input type="text" :value="link"></input>
	</div>
</div>
</template>
<script>
export default {
	props:[
		'characterClass',
		'gender',
		'helmet',
		'gauntlets',
		'chest',
		'boots',
		'classItem'
	],
	computed:{
		link(){
			let querystring = "";
			try{
				querystring+=`?class=${this.characterClass}`;
				querystring+=`&gender=${this.gender}`;
				querystring+=`&helmet=${this.helmet.hash}`;
				querystring+=`&gauntlets=${this.gauntlets.hash}`;
				querystring+=`&chest=${this.chest.hash}`;
				querystring+=`&boots=${this.boots.hash}`;
				querystring+=`&classItem=${this.classItem.hash}`;
			}catch(e){
			}

			return `${window.location.origin}${window.location.pathname}${querystring}`;
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
	border-bottom: 2px solid #CCCCCC;
	padding:8px;
	input{
		flex-grow: 2;
	}
}
</style>
