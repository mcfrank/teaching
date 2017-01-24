// For testing numTeachers

var output_file = "numTeachers-1example.csv";
var output_handle = webpplCsv.openFile(output_file);
webpplCsv.writeLine(output_handle, "trialNum, NumTeachers, target, IG, sortedStudents, scoreAboveBaseline");

var results = mapN(function(trialNum){

  var studentsArray = generateStudentsArray(100);
  var sortedStudents = sortStudents(studentsArray);

    var teacherAlpha = mu*10;
  var teacherMusMapping = map(function(mu){

    var teacherBeta = teacherNu - teacherAlpha;

    var targetParams = {alpha: teacherAlpha, beta: teacherBeta};

    var numTeachersMapping = map(function(numTeachers){

      var unsortedIG = Math.sum(getAdminIG(studentsArray, numTeachers, targetParams, 1));

      var sortedIG = Math.sum(getAdminIG(sortedStudents, numTeachers, targetParams, 1));
      

      webpplCsv.writeLine(output_handle, trialNum+","+numTeachers+"," + mu+"," + unsortedIG+",unsorted,0");
      webpplCsv.writeLine(output_handle, trialNum+","+numTeachers+"," + mu+"," + sortedIG+",sorted,0");
      return true;

    }, numTeachersArr);
  }, teacherMus);

}, 100);