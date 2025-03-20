import React, { useState, type ComponentProps } from "react";
import { Badge, Box, Button, ButtonGroup, FormControl, Grid, Input, Sheet, Typography } from "@mui/joy";
import Dropzone from 'react-dropzone'
import type { ClassificationGroup, ImageSource } from "./Model";
import { ImageCanvas } from "./ImageDataRenderer";
import { Close } from "@mui/icons-material";


export const DataSetModalContent: React.FC<{
    dataset: ClassificationGroup | null,
    onClose: () => void,
    setDataSet: (dataSet: ClassificationGroup) => void
    getFaceImageData: (source: ImageSource) => Promise<ImageData | undefined>
}> = ({
    dataset, onClose, setDataSet, getFaceImageData
}) => {
        const [newName, setNewName] = useState(dataset?.name ?? '');
        const [imageArray, setImageArray] = useState<ImageSource[]>(dataset?.dataset ?? []);

        const handleSave = () => {
            setDataSet({ name: newName, dataset: imageArray });
            onClose();
        }

        const handleDrop: ComponentProps<typeof Dropzone>["onDrop"] = (acceptedFiles) => {
            acceptedFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        if (ctx) {
                            canvas.width = 224; // Resize to match MobileNet input size
                            canvas.height = 224;
                            ctx.drawImage(img, 0, 0, 224, 224);

                            const imageData = ctx.getImageData(0, 0, 224, 224);
                            setImageArray(
                                (prev) => [...prev, imageData]
                            );
                        }
                    };
                    img.src = reader.result as string;
                };
                reader.readAsDataURL(file);
            });
        };

        return (
            <>
                <Typography>Edit Data Set</Typography>
                <FormControl>
                    <Input
                        aria-label="Name of Dataset"
                        placeholder="Name"
                        type="text" value={newName} onChange={(event) => setNewName(event.target.value)} />
                </FormControl>

                <Sheet variant="soft" color="neutral" sx={{ p: 4 }}>
                    <Dropzone onDrop={handleDrop} accept={{ 'image/*': [] }}>
                        {({ getRootProps, getInputProps }) => (
                            <section>
                                <div {...getRootProps()}>
                                    <input {...getInputProps()} />
                                    <p>Drag some files here, or click to select files</p>
                                </div>
                            </section>
                        )}
                    </Dropzone>
                </Sheet>
                <Box sx={{ overflowY: 'scroll', py: 3 }}>
                    <Grid container spacing={2}>
                        {imageArray.map((image, index) => {
                            return (<Grid key={index}>
                                <Badge variant="outlined" color="danger" role="button" onClick={() => {
                                    setImageArray(imageArray.filter((_, i) => i !== index));
                                }} badgeContent={
                                    <Close />
                                }>
                                    <ImageCanvas source={image} getFaceImageData={getFaceImageData} />
                                </Badge>
                            </Grid>)
                        }
                        )}
                    </Grid>
                </Box>
                <ButtonGroup>
                    <Button variant="outlined" color="danger" onClick={onClose}>Cancel</Button>
                    <Button variant="outlined" color="primary" onClick={handleSave}>Save</Button>
                </ButtonGroup>
            </>
        );
    };