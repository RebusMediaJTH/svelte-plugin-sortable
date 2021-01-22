// update this file to match your Schema
export const initialState = {
    enabled: true,
    title: "Title...",
    instructions: "Instructions...",
    containerSizeCanChange: true,
    allowReset: true,
    orientation: "Vertical",
    isCorrect: false,
    correctCount: 2,
    showHints: true,
    containers: [
        {id: "box-1", label: "Box 1", ordered: false},
        {id: "box-2", label: "Box 2", ordered: false}
    ],
    items: [
        {
            id: "item-1",
            label: "Item 1",
            image: "",
            imageAlt: "",
            currentPosition: [0, 0],
            initialPosition: [0, 0],
            correctPosition: [0, 2]
        },
        {
            id: "item-2",
            label: "Item 2. Some very long text here to cause a wrap in the item.",
            image: "",
            imageAlt: "",
            currentPosition: [0, 1],
            initialPosition: [0, 1],
            correctPosition: [1, 0]
        },
        {
            id: "item-3",
            label: "Item 3",
            image: "",
            imageAlt: "",
            currentPosition: [0, 2],
            initialPosition: [0, 2],
            correctPosition: [1, 1]
        },
        {
            id: "item-4",
            label: "<strong>Item 4</strong>",
            image: "",
            imageAlt: "",
            currentPosition: [1, 0],
            initialPosition: [1, 0],
            correctPosition: [0, 0]
        },
        {
            id: "item-5",
            label: "<strong>Item 5. Image.</strong>",
            image: "./slot-img-1.jpg",
            imageAlt: "Image description",
            layout: "Vertical",
            currentPosition: [1, 1],
            initialPosition: [1, 1],
            correctPosition: [1, 2]
        },
        {
            id: "item-6",
            label: "<strong>Item 6</strong>",
            image: "",
            imageAlt: "",
            currentPosition: [1, 2],
            initialPosition: [1, 2],
            correctPosition: [0, 1]
        }
    ]
};
