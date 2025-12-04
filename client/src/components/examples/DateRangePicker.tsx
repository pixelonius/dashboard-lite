import DateRangePicker from '../DateRangePicker';

export default function DateRangePickerExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Date Range Selector</h3>
        <DateRangePicker 
          onRangeChange={(from, to, preset) => {
            console.log('Range changed:', { from, to, preset });
          }}
        />
      </div>
    </div>
  );
}
