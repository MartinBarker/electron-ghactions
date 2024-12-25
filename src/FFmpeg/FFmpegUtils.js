export function createFFmpegCommand(configs) {
    try {
        const {
            audioInputs = [],
            imageInputs = [],
            outputFilepath,
            width = 2000,
            height = 2000,
            paddingCheckbox = false,
            forceOriginalAspectRatio = true,
            backgroundColor = 'black',
            stretchImageToFit = false,
            repeatLoop = true
        } = configs;

        console.log('ffmpegUtils Configs:', configs);

        let cmdArgs = [];
        cmdArgs.push('-y'); // Overwrite output file if exists

        let outputDuration = 0;
        audioInputs.forEach(audio => {
            outputDuration += audio.duration;
        });
        const imgDuration = outputDuration / imageInputs.length;

        let fc_audioFiles = '';
        let fc_imgOrder = '';
        let fc_finalPart = '';

        [...audioInputs, ...imageInputs].forEach((file, index) => {
            cmdArgs.push('-r', '2', '-i', `"${file.filepath.replace(/\\/g, '/')}"`);

            if (file.filetype === 'audio') {
                fc_audioFiles += `[${index}:a]`;
            } else if (file.filetype === 'image') {
                let scaling = `scale=w=${width}:h=${height}`;
                let padding = paddingCheckbox
                    ? `,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${backgroundColor}`
                    : '';
                if (stretchImageToFit) {
                    padding = '';
                }
                fc_imgOrder += `[${index}:v]${scaling}${padding},setsar=1,loop=${Math.ceil(imgDuration * 2)}:${Math.ceil(imgDuration * 2)}[v${index}];`;
                fc_finalPart += `[v${index}]`;
            }
        });

        // Concatenate audio files if more than one
        if (audioInputs.length > 1) {
            fc_audioFiles += `concat=n=${audioInputs.length}:v=0:a=1[a];`;
        }

        // Build final video concat
        fc_finalPart += `concat=n=${imageInputs.length}:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]`;

        // Final filter_complex
        let filterComplex = `${fc_audioFiles}${fc_imgOrder}${fc_finalPart}`;

        cmdArgs.push('-filter_complex', `"${filterComplex}"`);
        cmdArgs.push('-map', '[v]', '-map', '[a]');
        cmdArgs.push(
            '-c:v', 'libx264',
            '-c:a', 'pcm_s32le',
            '-bufsize', '3M',
            '-crf', '18',
            '-pix_fmt', 'yuv420p',
            '-tune', 'stillimage',
            '-t', outputDuration.toFixed(2),
            `"${outputFilepath.replace(/\\/g, '/')}"` // Normalize output path
        );

        const commandString = cmdArgs.join(' ');
        console.log('Generated FFmpeg Command:', commandString);

        return { cmdArgs, outputDuration, commandString };
    } catch (error) {
        console.error('Error creating FFmpeg command:', error);
        return { error: error.message };
    }
}
