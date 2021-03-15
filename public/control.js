const Control = {
    controlDiv: null,
    selectors: [],
    dropDowns: [],
    selectorData: null,
    maxSelectorId: 1,

    async initiate(){
        Control.controlDiv = $('div .control');
        Control.selectors[0] = $('#selector1');
        Control.dropDowns[0] = $('#dropdown1');
        Control.selectorData = (await Control.loadDataPreview());
        Control.renderPreviewData();

    },
    async loadDataPreview(){
        try{
            let data = (await $.get('/api/geo'));
            data = typeof data === 'string' ? JSON.parse(data) : data;

            data = data.methods;

            data = Control.purifyData(data);

            return data;
        } catch (e) {
            if(e.status !== 404)
            {
                throw new Error('Unexpected Response from API! ' + e);
            }
        }
    },
    purifyData(data){
        let purified = {};

        for(let key in data)
        {
            if(key !== 'methods')
            {
                purified[key] = Control.purifyData(data[key]);
            }
        }

        if(data.methods !== undefined)
        {
            for(let m of data.methods)
            {
                purified[m] = m;
            }
        }

        return purified;
    },
    renderPreviewData(data = Object.assign({}, Control.selectorData), selections = [], path = [])
    {
        let index = path.length;

        if(index === 0)
        {
            for(let i = 0; i <= Control.maxSelectorId; ++i)
            {
                $(`#dropdown${i}`).empty();
            }
        }


        for(let key in data)
        {
            $(`#dropdown${index}`).append(`<li><a id='_control_${index}_${key}'>${key}</button></li>`);
            let click = ButtonHandler.hasImplementation(path, key);
            if(click)
            {
                $(`#_control_${index}_${key}`).click(()=>{

                    if(typeof click === 'function'){
                        click(path, key);
                    }
                    Control.handleSelectionClick(path, key)});
            } else {
                $(`#_control_${index}_${key}`).addClass('disabled_selector')
            }
        }

        $(`#selector${index}`).show();

        if(selections.length !== 0 && index !== Control.maxSelectorId && data[selections[0]] && typeof data[selections[0]] !== 'string')
        {
            Control.renderPreviewData(data[selections[0]], selections.slice(1), path.concat(selections[0]));
        } else {
            for(let i = ++index; i <= Control.maxSelectorId; ++i)
            {
                $(`#dropdown${i}`).empty();
                $(`#selector${i}`).hide();
            }
        }
    },
    handleSelectionClick(path, key)
    {
        Control.renderPreviewData(Object.assign({}, Control.selectorData), [...path, key], []);
    }
};


const ButtonHandler = {
  hasImplementation(path, key, handlers = Handlers)
  {

      if(handlers[key] && typeof handlers[key] === 'function')
      {
          return path.length === 0 ? handlers[key] : false;
      }

      if(path.length > 0)
      {
          if(!handlers[path[0]])
          {
              return false;
          }
          return ButtonHandler.hasImplementation(path.slice(1), key, handlers[path[0]]);
      }

      return handlers[key];

  }
};


const Handlers = {
    async districts(){
        let data = await $.ajax('/api/geo/districts');
        data = typeof data === 'string' ? JSON.parse(data) : data;
        console.info(data);
        AppMap.getDistrictColor = (district)=>{return '#00000';};
        AppMap.drawDistricts(data, undefined);
    },
    _districts: {
        '2020': async ()=>{
            let data = await $.ajax('/api/geo/election_districts/2020');
            data = typeof data === 'string' ? JSON.parse(data) : data;
            AppMap.getDistrictColor = app.districtColor;
            AppMap.drawDistricts(data, undefined);
        }
    }
};