export interface Command {
    command: string;
}

export interface GroupBeginCommand extends Command {}

export interface CopyInputPageCommand extends Command {
    inputFileName: string;
    inputPage: number;
    transformation?: number[];
    copySheetNames?: boolean;
}

export interface OverrideSheetNameCommand extends Command {
    index: number;
    value: string;
}

export interface Commands {
    pages: Command[][];
}

export interface PageSizes {
    pageCount: number;
    sizes: number[][];
}

export interface Group {
    group: { [key: string]: string };
    pageCount: number;
    pageSizes: number[][];
    pageNumbers: number[];
}

export interface MetaContext {
    totalPages: number;
    groups: Group[];
}

export interface Metadata {
    groupSizes: number[];
    pageSizes: (number | number[])[];
    groups: { [key: string]: string }[];
}
