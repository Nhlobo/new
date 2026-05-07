package com.waterwise.ui;
import android.os.Bundle; import android.view.*; import android.widget.TextView;
import androidx.annotation.*; import androidx.fragment.app.Fragment;
import com.waterwise.R;
public class ScreenFragment extends Fragment {
 @Nullable @Override public View onCreateView(@NonNull LayoutInflater i,@Nullable ViewGroup c,@Nullable Bundle b){
  View v=i.inflate(R.layout.fragment_screen,c,false);
  String title=getArguments()!=null?getArguments().getString("title","WaterWise") : "WaterWise";
  ((TextView)v.findViewById(R.id.screenTitle)).setText(title);
  return v;
 }
}
