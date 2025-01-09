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
            filterComplexStr += `[${imgIndex}:v]scale=w=${width}:h=${height},setsar=1,loop=${Math.round(imgDuration * 25)}:1[v${imgIndex}];`;
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



export function createFFmpegCommand2(configs) {
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

        // Determine output format
        const isMP4 = outputFilepath.toLowerCase().endsWith('.mp4');

        // Determine the file path separator
        const sampleInput = audioInputs.length > 0 ? audioInputs[0].filepath : imageInputs[0].filepath;
        const osSeparator = sampleInput.includes('\\') ? '\\' : '/';

        // Initialize command arguments
        const cmdArgs = ['-y']; // Overwrite output files
        let outputDuration = 0;
        audioInputs.forEach(audio => {
            outputDuration += audio.duration;
        });

        const imgDuration = outputDuration / imageInputs.length;

        // Input configuration
        audioInputs.forEach((audio, index) => {
            cmdArgs.push('-i', `${audio.filepath.replace(/\\/g, '/')}`);
        });

        imageInputs.forEach((image, index) => {
            cmdArgs.push('-i', `${image.filepath.replace(/\\/g, '/')}`);
        });

        // Filter complex for audio and video
        let filterComplex = '';
        if (audioInputs.length > 0) {
            filterComplex += `[0:a]apad,aresample=async=1:out_sample_rate=${isMP4 ? '44100' : '48000'}[audio];`;
        }

        imageInputs.forEach((image, index) => {
            let scaleFilter = `scale=ceil(iw/2)*2:ceil(ih/2)*2`;
            let padFilter = paddingCheckbox
                ? `,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${backgroundColor}`
                : '';
            filterComplex += `[${index + audioInputs.length}:v]${scaleFilter}${padFilter}[vid${index}];`;
        });

        // Concatenate video inputs
        const videoConcat = imageInputs.map((_, index) => `[vid${index}]`).join('');
        filterComplex += `${videoConcat}concat=n=${imageInputs.length}:v=1:a=0[v]`;

        cmdArgs.push('-filter_complex', filterComplex);

        // Map streams
        cmdArgs.push('-map', '[v]');
        if (audioInputs.length > 0) {
            cmdArgs.push('-map', '[audio]');
        }

        // Codec and output options
        cmdArgs.push(
            '-c:v', 'libx264',
            '-bufsize', '3M',
            '-maxrate', '3M',  // Add maxrate to match bufsize
            '-crf', '18',
            '-pix_fmt', 'yuv420p',
            '-tune', 'stillimage'
        );

        // Audio codec selection based on output format
        if (isMP4) {
            cmdArgs.push(
                '-c:a', 'aac',
                '-b:a', '320k'
            );
        } else {
            // For MKV, we can use PCM
            cmdArgs.push(
                '-c:a', 'pcm_s16le'  // Using 16-bit PCM instead of 32-bit for better compatibility
            );
        }

        cmdArgs.push(
            '-t', outputDuration.toFixed(2),
            `${outputFilepath.replace(/\\/g, osSeparator)}`
        );

        const commandString = cmdArgs.join(' ');
        console.log('Generated FFmpeg Command:', commandString);

        return { cmdArgs, outputDuration, commandString };
    } catch (error) {
        console.error('Error creating FFmpeg command:', error);
        return { error: error.message };
    }
}