export function createFFmpegCommand(configs) {
    const {
        audioInputs,
        imageInputs,
        outputFilepath,
        width,
        height,
        paddingCheckbox,
        forceOriginalAspectRatio,
        backgroundColor = 'black',
        stretchImageToFit = false,
        repeatLoop = false
    } = configs;

    let cmdArgs = [];

    // Calculate total output duration from audio inputs
    let outputDuration = audioInputs.reduce((acc, audio) => acc + parseFloat(audio.durationSeconds || 0), 0);

    // Determine image duration if not syncing with audio
    let imgDuration = outputDuration / imageInputs.length;

    // Filter complex variables
    let fc_audioFiles = '';
    let fc_imgOrder = '';
    let fc_finalPart = '';

    // Process each input
    [...audioInputs, ...imageInputs].forEach((file, index) => {
        cmdArgs.push('-i', file.filePath);

        if (file.type === 'audio') {
            fc_audioFiles += `[${index}:a]`;
        } else if (file.type === 'image') {
            let padding = '';

            if (paddingCheckbox) {
                padding = `,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${backgroundColor}`;
            }

            let scaling = forceOriginalAspectRatio ? 'scale=w=${width}:h=-1' : `scale=w=${width}:h=${height}`;

            if (stretchImageToFit) {
                scaling = `scale=w=${width}:h=${height}`;
                padding = '';
            }

            let loopOption = repeatLoop ? `loop=1:size=${Math.floor(imgDuration * 30)}` : '';

            fc_imgOrder += `
                [${index}:v]${scaling}${padding},setsar=1,${loopOption}[v${index}];
            `;
            fc_finalPart += `[v${index}]`;
        }
    });

    // Construct audio concat filter
    if (audioInputs.length > 1) {
        fc_audioFiles += `concat=n=${audioInputs.length}:v=0:a=1[a];`;
    } else {
        fc_audioFiles += `[a];`;
    }

    // Construct image concat filter
    fc_finalPart += `concat=n=${imageInputs.length}:v=1:a=0,format=yuv420p[v];`;

    // Build filter_complex
    let filterComplex = `${fc_audioFiles}${fc_imgOrder}${fc_finalPart}`;

    // Add filter_complex and mapping to cmdArgs
    cmdArgs.push('-filter_complex', filterComplex);
    cmdArgs.push('-map', '[v]', '-map', '[a]');

    // Add encoding options
    cmdArgs.push(
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-t', outputDuration.toFixed(2),
        outputFilepath
    );

    return { cmdArgs, outputDuration };
}
