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
		'helmetShader',
		'gauntlets',
		'gauntletsShader',
		'chest',
		'chestShader',
		'boots',
		'bootsShader',
		'classItem',
		'classItemShader'
	],
	computed:{
		link(){
			let querystring = "";
			try{
				querystring+=`?class=${this.characterClass}`;
				querystring+=`&gender=${this.gender}`;
				querystring+=`&helmet=${this.helmet.hash}`;
				if(this.helmetShader) querystring+=`&helmetShader=${this.helmetShader.hash}`;
				querystring+=`&gauntlets=${this.gauntlets.hash}`;
				if(this.gauntletsShader) querystring+=`&gauntletsShader=${this.gauntletsShader.hash}`;
				querystring+=`&chest=${this.chest.hash}`;
				if(this.chestShader) querystring+=`&chestShader=${this.chestShader.hash}`;
				querystring+=`&boots=${this.boots.hash}`;
				if(this.bootsShader) querystring+=`&bootsShader=${this.bootsShader.hash}`;
				querystring+=`&classItem=${this.classItem.hash}`;
				if(this.classItemShader) querystring+=`&classItemShader=${this.classItemShader.hash}`;
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
