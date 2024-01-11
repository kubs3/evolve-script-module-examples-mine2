export class Parameters {

    static descriptionOutputParameter: BasicOutputParameterDescription = {
        id: "coverPageGenerator",
        type: "BundledGenerateArray",
        displayName: "Impositioning bundle",
        description: "Bundles the generate step.",
    };
    
     static inputParamInputFilePath: InputParameterDescription = {
        id: "inputFilePath",
        displayName: "Input file path",
        description: "Path to TNO file containing source data.",
        type: "InputResource",
        required: false,
    };
    
    static inputParamInputFilePathV2: InputParameterDescription = {
        id: "inputFilePath",
        displayName: "Input file path",
        description:
            "Path to the TNO file containing source data. If left empty, the search for the TNO file is performed in the job://output folder.",
        type: "String",
        required: false,
    };
    
    static inputParamMetadataFilePath: InputParameterDescription = {
        id: "metadataFilePath",
        displayName: "Metadata file path",
        description:
            "Path to the metadata file. If left empty, the search for the file is performed in the same location as for the input file with the JSON extension, including the full name of the file (e.g. share://file.tno.json).",
        type: "InputResource",
        required: false,
    };
    
    static inputParamPrefixPagePath: InputParameterDescription = {
        id: "prefixPagePath",
        displayName: "Prefix page path",
        description:
            "Path to extra page used as prefix",
        type: "Connector",
        required: false,
    };
    
    static inputParamSufixPagePath: InputParameterDescription = {
        id: "sufixPagePath",
        displayName: "Sufix page path",
        description:
            "Path to extra page used as suffix",
        type: "Connector",
        required: false,
    };
    
    static inputParamOutputFilePath: InputParameterDescription = {
        id: "outputFilePath",
        displayName: "Output file path",
        description:
            "Path where the output file will be stored. If undefined, output will be stored in the same location as the input file using the extension of the selected output type. Note that in such a case, the input file may be overwritten.",
        type: "OutputResource",
        required: false,
    };
    
    static inputParamOutputFilePathV2: InputParameterDescription = {
        id: "outputFilePath",
        displayName: "Output file path",
        description:
            "Path where the output file will be stored. If undefined, output will be stored in the same location as the input file using the extension of the selected output type. Note that in such a case, the input file may be overwritten.",
        type: "String",
        required: false,
    };
    
    static inputParamOutputType: SelectionInputParameterDescription = {
        id: "outputType",
        displayName: "Output type",
        description: "Desired output type.",
        type: "Selection",
        options: ["PDF", "AFP", "InspireNative", "MTIFF"],
        required: true,
        defaultValue: "InspireNative",
    };
    
    static inputParamProductionConfigurationType: SelectionInputParameterDescription = {
        id: "productionConfigurationType",
        displayName: "Production configuration prefix",
        description: "Prefix (type) locating the production configuration file.",
        type: "Selection",
        options: ["Icm", "IcmSampleSolutions", "IcmCustomSolutions", "Custom"],
        required: false,
        defaultValue: "Custom",
    };
    
    static inputParamProductionConfiguration: InputParameterDescription = {
        id: "productionConfiguration",
        displayName: "Production configuration",
        description: "Path to production configuration file following the prefix (type).",
        type: "String",
        required: false,
    };
    
    static descriptionImpositioningInputParameters = [
        Parameters.inputParamInputFilePath,
         Parameters.inputParamMetadataFilePath,
         Parameters.inputParamOutputFilePath,
         Parameters.inputParamOutputType,
         Parameters.inputParamProductionConfigurationType,
         Parameters.inputParamProductionConfiguration, 
    ] as const;
    
    static descriptionImpositioningInputParametersV2 = [
        Parameters.inputParamInputFilePathV2,
        Parameters.inputParamMetadataFilePath,
        Parameters.inputParamOutputFilePathV2,
        Parameters.inputParamOutputType,
        Parameters.inputParamProductionConfigurationType,
        Parameters.inputParamProductionConfiguration,
    ] as const;
}

export function getInputFilePath(context: Context): string {
    const path = context.parameters.inputFilePath;
    if (isStringValid(path)) {
        return pathToWorkingDir(path);
    }else {
        throw new Error("Input file path is not valid or file not exists");
      }
}

export function getMetadataFile(context: Context, inputFile: string): string {
    const file = context.parameters.metadataFilePath as string;
    if (isStringValid(file)) {
        return pathToWorkingDir(file);
    } else {
        return inputFile + ".json";
    }
}

export async function getPrefixPagePath(context: Context): Promise<string  | null> {
    const path = context.parameters.prefixPagePath;
    if (isStringValid(path)) {
        if (path.endsWith(".pdf") || path.endsWith(".tno")) {
          return pathToWorkingDir(path);
        } else {
          throw new Error("Prefix input path must be a valid PDF or TNO file");
        }
      }

    return null;
}

export async function getSufixPagePath(context: Context): Promise<string  | null> {
    const path = context.parameters.sufixPagePath;
    if (isStringValid(path)) {
        if (path.endsWith(".pdf") || path.endsWith(".tno")) {
          return pathToWorkingDir(path);
        } else {
          throw new Error("Sufix path must be a valid PDF or TNO file");
        }
      }
   
        return null;
}

export function isStringValid(value: unknown): value is string {
    if (typeof value !== "string") return false;
    if (value.trim().length > 0) {
        return true;
    }
    return false;
}
export function isNumberValid(value: unknown): value is number {
    if (typeof value !== "number") return false;
    return true;
}

export function pathToWorkingDir(path: string): string {
    const workingDir = "job://";
    if (!isStringValid(path)) {
        return workingDir;
    }

    if (path.includes("://")) {
        return path;
    }

    if (path[0] === "/") {
        path = path.substring(1);
    }

    return workingDir + path;
}

