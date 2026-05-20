type Props = {
  imageData: string;
};

export const MemeViewer = ({ imageData }: Props) => {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#0e0e0e] flex items-center justify-center">
      <img
        src={imageData}
        alt="Meme"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
