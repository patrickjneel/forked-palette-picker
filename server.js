const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);


const requireHTTPS = (request, response, next) => {
  if(request.header('x-forwarded-proto') !== 'https') {
    return response.redirect(`https://${request.header('host')}${request.url}`);
  }
  next()
}

if (process.env.NODE_ENV === 'production') { 
  app.use(requireHTTPS); 
}

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

app.locals.title = 'Palette-Picker';

app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is listening at ${app.get('port')}`)
})
app.get('/', (request, response) => {
  return response.send('palettepicker');
});
app.get('/api/v1/projects', (request, response) => {
  database('projects').select()
    .then(projects => {
      return response.status(200).json({ projects })
    })
    .catch(error => {
      return response.status(500).json({ error})
    })
})

app.get('/api/v1/palettes', (request, response) => {
  database('palette').select()
    .then(palette => {
      if(palette.length) {
        return response.status(200).json({ palette })
      } else {
        return response.status(404).json({
          error: 'Could not find the platte'
        })
      }
    })
    .catch(error => {
      return response.status(500).json({ error })
    })
})
app.post('/api/v1/projects', (request, response) => {

  const project = request.body;
  for(let requiredParams of ['projectName']) {
    if(!project[requiredParams]) {
      return response.status(422).json({
        error: `You are missing a required a field ${requiredParams}`
      })
    }
  }
    database('projects').insert(project, 'id')
      .then(project => {
        return response.status(201).json({ id: project[0] })
      })
      .catch(error => {
        return response.status(500).json({ error })
      })
})

app.post('/api/v1/projects/:projectId/palettes', (request, response) => {
  const { projectId } = request.params;
  const palette = Object.assign({}, request.body.palette, {projects_id: projectId});

  for(let requiredParams of ['projectName', 'paletteName', 'color1', 'color2', 'color3', 'color4','color5' ]) {
    if(!palette[requiredParams]) {
      return response.status(422).json({
        error: `You are missing a required field ${requiredParams}`
      })
    }
  }
    database('palette').insert(palette, 'id')
      .then(palette => {
        return response.status(201).json({ id: palette[0] })
      })
      .catch(error => {
        return response.status(500).json({ error })
      })
})

app.delete('/api/v1/projects/palettes/:id', (request, response) => {
  const id = request.params;

  database('palette').where(id).del()
    .then(palette => {
      if(!palette) {
        response.status(422).json({error: 'This palette does not exist'})
      } else {
        response.sendStatus(204);
      }
    })
    .catch(error => response.status(500).json({ error}))
});


module.exports = app;
