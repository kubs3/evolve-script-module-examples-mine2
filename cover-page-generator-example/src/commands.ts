import { ipsPathNormalizer } from "./impositioning";
import type { Commands, CopyInputPageCommand, GroupBeginCommand, OverrideSheetNameCommand } from "./types";

export function createGroupBeginCommmand(): GroupBeginCommand {
    return {
        command: "SetGroupBegin",
    };
}

export function createOverrideSheetNameCommand(index: number, value: string): OverrideSheetNameCommand {
    return {
        command: "OverrideSheetName",
        index: index,
        value: value,
    };
}

export function createPageSizeCommmand(size: number[]): OverrideSheetNameCommand {
    const formattedSize = "(" + size[0] + "m," + size[1] + "m)";
    return createOverrideSheetNameCommand(1, formattedSize);
}

export function createCopyInputPageCommand(
    context: Context,
    inputFileName: string,
    inputPageNumber: number,
    transformation: number[] | undefined = undefined,
    copySheetNames: boolean = true,
): CopyInputPageCommand {
    return {
        command: "CopyInputPage",
        inputFileName: ipsPathNormalizer(inputFileName, context),
        inputPage: inputPageNumber,
        copySheetNames: copySheetNames,
        transformation: transformation,
    };
}

