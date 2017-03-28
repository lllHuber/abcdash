export class ReplaceWhiteSpaceValueConverter {
    
    toView(array, character) {
		array = array.replace(/\s/g, character);
		return array;
	}
}