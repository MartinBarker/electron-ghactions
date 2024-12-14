export function createFFmpegCommand(configs) {
    const command = [];

    if (configs.input) {
        command.push('-i', configs.input);
    }

    if (configs.output) {
        command.push(configs.output);
    }

    if (configs.options) {
        for (const [key, value] of Object.entries(configs.options)) {
            command.push(key, value);
        }
    }

    return command;
}