export function createFFmpegCommand(configs) {
    try {
        const {
            audioInputs = [],
            imageInputs = [],
            outputFilepath,
            width = 2000,
            height = 2000,
            paddingCheckbox = false,
            backgroundColor = 'black',
            stretchImageToFit = false,
            repeatLoop = true,
            debugBypass = false
        } = configs;

        console.log('FFmpeg Configurations:', configs);
        const cmdArgs = ['-y']; // Overwrite output files

        // get output duration
        let outputDuration = 0;
        audioInputs.forEach(audio => {
            outputDuration += audio.duration;
            if (audio.startTime) {
                console.log(`Start Time for ${audio.filename}: ${audio.startTime}`);
            }
            if (audio.endTime) {
                console.log(`End Time for ${audio.filename}: ${audio.endTime}`);
            }
        });

        // determine duration for each image, split evenly across the output duration
        const imgDuration = outputDuration / imageInputs.length;
        console.log('there are ' + imageInputs.length + ' images, each will be displayed for ' + imgDuration + ' seconds');

        // add audio inputs
        audioInputs.forEach((audio) => {
            cmdArgs.push('-i', `${audio.filepath.replace(/\\/g, '/')}`);
        });

        // add image inputs
        imageInputs.forEach((image) => {
            cmdArgs.push('-i', `${image.filepath.replace(/\\/g, '/')}`);
        });

        // generate filter complex
        let filterComplexStr = '';

        // 1. Add boxes for each audio input
        filterComplexStr += audioInputs.map((_, index) => `[${index}:a]`).join('');

        // 2. Concat all audio inputs
        filterComplexStr += `concat=n=${audioInputs.length}:v=0:a=1[a];`;

        // 3/4. Process each image input
        imageInputs.forEach((image, index) => {
            const imgIndex = audioInputs.length + index;
            let scaleFilter = stretchImageToFit 
                ? `scale=w=${width}:h=${height}` 
                : `scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease`;
            let padFilter = stretchImageToFit 
                ? '' 
                : `,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${image.paddingColor || backgroundColor}`;
            filterComplexStr += `[${imgIndex}:v]${scaleFilter}${padFilter},setsar=1,loop=${Math.round(imgDuration * 25)}:1[v${imgIndex}];`;
        });
        

        // 5. Concat all scaled images and pad them
        const imageRefs = imageInputs.map((_, index) => `[v${audioInputs.length + index}]`).join('');
        filterComplexStr += `${imageRefs}concat=n=${imageInputs.length}:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]`;

        console.log('Generated filter complex:', filterComplexStr);

        // add filter complex
        cmdArgs.push('-filter_complex', filterComplexStr);

        // add map commands
        cmdArgs.push('-map', '[v]');
        cmdArgs.push('-map', '[a]');

        // Codec selection based on output format
        const isMP4 = outputFilepath.toLowerCase().endsWith('.mp4');
        if (isMP4) {
            cmdArgs.push(
                '-c:a', 'aac',
                '-b:a', '320k',
                '-c:v', 'h264',
                '-movflags', '+faststart',
                '-profile:v', 'high',
                '-level:v', '4.2'
            );
        } else {
            cmdArgs.push(
                '-c:a', 'pcm_s32le',
                '-c:v', 'libx264'
            );
        }

        // add bufsize
        cmdArgs.push('-bufsize', '3M');

        // add crf
        cmdArgs.push('-crf', '18');

        // add pix fmt
        cmdArgs.push('-pix_fmt', 'yuv420p');

        // add tune
        cmdArgs.push('-tune', 'stillimage');

        // add output duration
        cmdArgs.push('-t', `${outputDuration}`);

        // add output file path
        cmdArgs.push(`${outputFilepath}`);

        // generate command string
        const commandString = cmdArgs.join(' ');
        console.log('\n\n returning cmdArgs = ', cmdArgs, '\n\n')

        // return command string
        return { cmdArgs, outputDuration, commandString };
    } catch (error) {
        console.error('Error creating FFmpeg command:', error);
        return { error: error.message };
    }
}



