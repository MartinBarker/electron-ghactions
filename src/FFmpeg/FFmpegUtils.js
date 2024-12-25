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
            debugBypass = false // Debug flag
        } = configs;

        console.log('FFmpeg Configurations:', configs);

        // Determine the file path separator
        const sampleInput = audioInputs.length > 0 ? audioInputs[0].filepath : imageInputs[0].filepath;
        const osSeparator = sampleInput.includes('\\') ? '\\' : '/';

        // Debug mode: Simple MP3 conversion
        if (debugBypass && audioInputs.length > 0) {
            const inputAudio = audioInputs[0].filepath;
            const uniqueTimestamp = Date.now();
            const outputAudio = inputAudio.replace(/\.[^/.]+$/, `-converted-${uniqueTimestamp}.mp3`);

            const cmdArgs = [
                '-y',
                '-i', `${inputAudio}`,
                '-codec:a', 'libmp3lame',
                '-qscale:a', '9',
                `${outputAudio}`
            ];

            console.log('Generated Debug Command:', cmdArgs.join(' '));
            return { cmdArgs, outputDuration: 0, commandString: cmdArgs.join(' ') };
        }

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
            filterComplex += `[0:a]apad,aresample=async=1[audio];`;
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
            '-c:a', 'pcm_s32le',
            '-bufsize', '3M',
            '-crf', '18',
            '-pix_fmt', 'yuv420p',
            '-tune', 'stillimage',
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
