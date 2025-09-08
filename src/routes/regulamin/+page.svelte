<script>
	import regulationsContent from '../../assets/docs/regulamin.md?raw';
	import showdown from 'showdown';

	let converter = new showdown.Converter();
	const valueAsHtml = converter.makeHtml(regulationsContent);
</script>

<div class="prose max-w-none pl-2">
	{@html valueAsHtml}
</div>
